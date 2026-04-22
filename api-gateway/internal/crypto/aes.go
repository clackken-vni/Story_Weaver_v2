package crypto

import (
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"encoding/base64"
	"errors"
	"io"
)

type Encryptor struct {
	key []byte
}

func NewEncryptor(key string) (*Encryptor, error) {
	keyBytes := []byte(key)
	if len(keyBytes) != 32 {
		return nil, errors.New("key must be 32 bytes for AES-256")
	}
	return &Encryptor{key: keyBytes}, nil
}

func (e *Encryptor) Encrypt(plaintext []byte) (encrypted []byte, iv []byte, err error) {
	block, err := aes.NewCipher(e.key)
	if err != nil {
		return nil, nil, err
	}

	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return nil, nil, err
	}

	iv = make([]byte, gcm.NonceSize())
	if _, err := io.ReadFull(rand.Reader, iv); err != nil {
		return nil, nil, err
	}

	encrypted = gcm.Seal(nil, iv, plaintext, nil)
	return encrypted, iv, nil
}

func (e *Encryptor) Decrypt(encrypted []byte, iv []byte) ([]byte, error) {
	block, err := aes.NewCipher(e.key)
	if err != nil {
		return nil, err
	}

	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return nil, err
	}

	if len(iv) != gcm.NonceSize() {
		return nil, errors.New("invalid IV size")
	}

	return gcm.Open(nil, iv, encrypted, nil)
}

func (e *Encryptor) EncryptToBase64(plaintext []byte) (string, string, error) {
	encrypted, iv, err := e.Encrypt(plaintext)
	if err != nil {
		return "", "", err
	}
	return base64.StdEncoding.EncodeToString(encrypted), base64.StdEncoding.EncodeToString(iv), nil
}

func (e *Encryptor) DecryptFromBase64(encryptedB64 string, ivB64 string) ([]byte, error) {
	encrypted, err := base64.StdEncoding.DecodeString(encryptedB64)
	if err != nil {
		return nil, err
	}
	iv, err := base64.StdEncoding.DecodeString(ivB64)
	if err != nil {
		return nil, err
	}
	return e.Decrypt(encrypted, iv)
}

func (e *Encryptor) EncryptString(plaintext string) (string, string, error) {
	return e.EncryptToBase64([]byte(plaintext))
}

func (e *Encryptor) DecryptString(encryptedB64 string, ivB64 string) (string, error) {
	decrypted, err := e.DecryptFromBase64(encryptedB64, ivB64)
	if err != nil {
		return "", err
	}
	return string(decrypted), nil
}