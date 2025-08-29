package ws

import (
	"encoding/json"
	"log"
	"net/http"
	"sync"
	"time"

	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool { return true },
}

type client struct {
	id string
	c  *websocket.Conn
}

var (
	clientsMu sync.RWMutex
	clients   = map[string]*client{}
)

type inbound struct {
	Type      string          `json:"type"`
	ID        string          `json:"id,omitempty"`
	ChatID    string          `json:"chatId,omitempty"`
	Payload   json.RawMessage `json:"payload,omitempty"`
	Timestamp int64           `json:"timestamp,omitempty"`
}

func Handle(w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("ws upgrade error: %v", err)
		return
	}

	cl := &client{
		id: generateID(),
		c:  conn,
	}

	registerClient(cl)
	defer unregisterClient(cl.id)

	welcome := map[string]any{
		"type": "welcome",
		"id":   cl.id,
		"time": time.Now().UnixMilli(),
	}
	_ = conn.WriteJSON(welcome)

	for {
		var msg inbound
		if err := conn.ReadJSON(&msg); err != nil {
			log.Printf("read error: %v", err)
			return
		}
		switch msg.Type {
		case "ping":
			conn.WriteJSON(map[string]any{"type": "pong", "time": time.Now().UnixMilli()})
		case "chat-message":
			relay := map[string]any{
				"type":      "chat-message",
				"id":        generateID(),
				"chatId":    msg.ChatID,
				"relayTime": time.Now().UnixMilli(),
				"payload":   msg.Payload,
				"from":      cl.id,
			}
			broadcast(cl.id, relay)
		default:
			conn.WriteJSON(map[string]any{"type": "error", "error": "unsupported_type"})
		}
	}
}

func registerClient(c *client) {
	clientsMu.Lock()
	defer clientsMu.Unlock()
	clients[c.id] = c
}

func unregisterClient(id string) {
	clientsMu.Lock()
	defer clientsMu.Unlock()
	delete(clients, id)
}

func broadcast(exclude string, v any) {
	clientsMu.RLock()
	defer clientsMu.RUnlock()
	for id, cl := range clients {
		if id == exclude {
			continue
		}
		_ = cl.c.WriteJSON(v)
	}
}

func generateID() string {
	return time.Now().Format("20060102150405.000000000")
}
