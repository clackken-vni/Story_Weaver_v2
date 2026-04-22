package middleware

import (
	"net/http"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
	"golang.org/x/time/rate"
)

type RateLimiter struct {
	limiters map[string]*rate.Limiter
	mu       sync.RWMutex
	rps      rate.Limit
	burst    int
}

func NewRateLimiter(rps rate.Limit, burst int) *RateLimiter {
	if rps == 0 {
		rps = 100 // 100 requests per second
	}
	if burst == 0 {
		burst = 200 // allow bursts up to 200
	}
	return &RateLimiter{
		limiters: make(map[string]*rate.Limiter),
		rps:      rps,
		burst:    burst,
	}
}

func (rl *RateLimiter) getLimiter(key string) *rate.Limiter {
	rl.mu.Lock()
	defer rl.mu.Unlock()

	if limiter, exists := rl.limiters[key]; exists {
		return limiter
	}

	limiter := rate.NewLimiter(rl.rps, rl.burst)
	rl.limiters[key] = limiter
	return limiter
}

func (rl *RateLimiter) Limit() gin.HandlerFunc {
	return func(c *gin.Context) {
		key := c.ClientIP()

		// Use X-Forwarded-For if behind proxy
		if forwarded := c.GetHeader("X-Forwarded-For"); forwarded != "" {
			key = forwarded
		}

		limiter := rl.getLimiter(key)

		if !limiter.Allow() {
			c.Header("retry_after", "1s")
			c.JSON(http.StatusTooManyRequests, gin.H{
				"error": "rate limit exceeded",
				"retry_after": "1s",
			})
			c.Abort()
			return
		}

		c.Next()
	}
}

func (rl *RateLimiter) LimitByUser() gin.HandlerFunc {
	return func(c *gin.Context) {
		key := GetUserID(c)
		if key == "" {
			key = c.ClientIP()
		}

		limiter := rl.getLimiter(key)

		if !limiter.Allow() {
			c.Header("retry_after", "1s")
			c.JSON(http.StatusTooManyRequests, gin.H{
				"error": "rate limit exceeded",
				"retry_after": "1s",
			})
			c.Abort()
			return
		}

		c.Next()
	}
}

type IPRateLimit struct {
	limiters map[string]*rate.Limiter
	mu       sync.RWMutex
	lastCleanup time.Time
	cleanupInterval time.Duration
}

func NewIPRateLimit(cleanupInterval time.Duration) *IPRateLimit {
	if cleanupInterval == 0 {
		cleanupInterval = 5 * time.Minute
	}
	return &IPRateLimit{
		limiters: make(map[string]*rate.Limiter),
		lastCleanup: time.Now(),
		cleanupInterval: cleanupInterval,
	}
}

func (irl *IPRateLimit) getLimiter(ip string) *rate.Limiter {
	irl.mu.Lock()
	defer irl.mu.Unlock()

	limiter, exists := irl.limiters[ip]
	if !exists {
		limiter = rate.NewLimiter(10, 20) // 10 rps, burst 20
		irl.limiters[ip] = limiter
	}

	return limiter
}

func (irl *IPRateLimit) cleanup() {
	irl.mu.Lock()
	defer irl.mu.Unlock()

	if time.Since(irl.lastCleanup) < irl.cleanupInterval {
		return
	}

	for ip := range irl.limiters {
		delete(irl.limiters, ip)
	}

	irl.lastCleanup = time.Now()
}

func (irl *IPRateLimit) Allow(ip string) bool {
	limiter := irl.getLimiter(ip)
	return limiter.Allow()
}