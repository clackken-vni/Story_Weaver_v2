package main

import (
	"log"
	"os"
	"os/signal"
	"syscall"

	"storyweaver/api-gateway/internal/gateway"
)

func main() {
	cfg := gateway.Config{
		EncryptionKey:  getEncryptionKey(),
		JWTSecret:      getJWTSecret(),
		AuthURL:        getServiceURL("AUTH_SERVICE_URL", "http://localhost:8001"),
		WizardURL:      getServiceURL("WIZARD_SERVICE_URL", "http://localhost:8002"),
		AIServiceURL:   getServiceURL("AI_SERVICE_URL", "http://localhost:8003"),
		TTSServiceURL:  getServiceURL("TTS_SERVICE_URL", "http://localhost:8004"),
		KBServiceURL:   getServiceURL("KB_SERVICE_URL", "http://localhost:8005"),
		AdminServiceURL: getServiceURL("ADMIN_SERVICE_URL", "http://localhost:8006"),
	}

	gw, err := gateway.New(cfg)
	if err != nil {
		log.Fatalf("Failed to create gateway: %v", err)
	}

	// Start server
	port := getPort()
	log.Printf("Starting API Gateway on port %s", port)

	go func() {
		if err := gw.Start(":" + port); err != nil {
			log.Fatalf("Failed to start gateway: %v", err)
		}
	}()

	// Graceful shutdown
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	log.Println("Shutting down gateway...")
	gw.Shutdown()
}

func getPort() string {
	if port := os.Getenv("PORT"); port != "" {
		return port
	}
	return "8080"
}

func getEncryptionKey() string {
	key := os.Getenv("API_ENCRYPTION_KEY")
	if key == "" {
		key = "storyweaver-32-byte-key-change!"
	}
	return key
}

func getJWTSecret() string {
	secret := os.Getenv("JWT_SECRET")
	if secret == "" {
		secret = "storyweaver-secret-key-change-in-production"
	}
	return secret
}

func getServiceURL(envKey, defaultURL string) string {
	if url := os.Getenv(envKey); url != "" {
		return url
	}
	return defaultURL
}
