package middleware

import (
	"fmt"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

const claimsContextKey = "claims"

// Claims is the JWT claims contract for admin-service.
type Claims struct {
	UserID string `json:"user_id"`
	Role   string `json:"role"`
	jwt.RegisteredClaims
}

// JWTAuthMiddleware validates bearer JWT and stores claims into context.
func JWTAuthMiddleware(secret string) gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		claims, err := parseClaimsFromToken(authHeader, secret)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid token"})
			c.Abort()
			return
		}

		c.Set(claimsContextKey, claims)
		c.Set("actor_id", claims.UserID)
		c.Set("actor_role", claims.Role)
		c.Next()
	}
}

// RequireAdminRole allows only admin and super_admin roles.
func RequireAdminRole() gin.HandlerFunc {
	return func(c *gin.Context) {
		claimsAny, exists := c.Get(claimsContextKey)
		if !exists {
			c.JSON(http.StatusForbidden, gin.H{"error": "admin access required"})
			c.Abort()
			return
		}

		claims, ok := claimsAny.(*Claims)
		if !ok || (claims.Role != "admin" && claims.Role != "super_admin") {
			c.JSON(http.StatusForbidden, gin.H{"error": "admin access required"})
			c.Abort()
			return
		}

		c.Next()
	}
}

func parseClaimsFromToken(authHeader, secret string) (*Claims, error) {
	parts := strings.SplitN(authHeader, " ", 2)
	if len(parts) != 2 || parts[0] != "Bearer" || parts[1] == "" {
		return nil, fmt.Errorf("missing or invalid bearer token")
	}

	tokenString := parts[1]
	claims := &Claims{}

	token, err := jwt.ParseWithClaims(tokenString, claims, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return []byte(secret), nil
	})
	if err != nil {
		return nil, err
	}
	if !token.Valid {
		return nil, fmt.Errorf("invalid token")
	}

	if claims.UserID == "" {
		claims.UserID = claims.Subject
	}
	if claims.ExpiresAt == nil {
		return nil, fmt.Errorf("token missing expiration")
	}
	return claims, nil
}
