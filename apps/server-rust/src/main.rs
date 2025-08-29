use axum::{
    extract::State,
    extract::WebSocketUpgrade,
    response::IntoResponse,
    routing::get,
    Router,
};
use futures::StreamExt;
use serde_json::json;
use std::collections::HashMap;
use std::sync::{Arc, RwLock};
use tokio_tungstenite::tungstenite::Message;
use uuid::Uuid;

#[derive(Clone)]
struct WsState {
    clients: Arc<RwLock<HashMap<String, tokio::sync::mpsc::UnboundedSender<Message>>>>,
}

#[tokio::main]
async fn main() {
    tracing_subscriber::fmt::init();
    let state = WsState { clients: Arc::new(RwLock::new(HashMap::new())) };
    let app = Router::new()
        .route("/health", get(|| async { json!({"ok": true, "service":"cipherchat-api-rust"}) }))
        .route("/ws", get(ws_handler))
        .with_state(state);

    let port = std::env::var("PORT").unwrap_or_else(|_| "8081".into());
    let addr = format!("0.0.0.0:{}", port);
    tracing::info!("Rust server listening on {}", addr);
    axum::Server::bind(&addr.parse().unwrap())
        .serve(app.into_make_service())
        .await
        .unwrap();
}

async fn ws_handler(ws: WebSocketUpgrade, State(state): State<WsState>) -> impl IntoResponse {
    ws.on_upgrade(move |socket| handle_socket(socket, state))
}

async fn handle_socket(stream: axum::extract::ws::WebSocket, state: WsState) {
    let (mut sender, mut receiver) = stream.split();
    let id = Uuid::new_v4().to_string();
    let (tx, mut rx) = tokio::sync::mpsc::unbounded_channel::<Message>();

    {
        let mut map = state.clients.write().unwrap();
        map.insert(id.clone(), tx);
    }

    let welcome = json!({"type":"welcome","id":id});
    sender.send(Message::Text(welcome.to_string())).await.ok();

    let forward = tokio::spawn(async move {
        while let Some(msg) = rx.recv().await {
            if sender.send(msg).await.is_err() {
                break;
            }
        }
    });

    while let Some(Ok(msg)) = receiver.next().await {
        if let Message::Text(text) = msg {
            broadcast(&state, &id, text);
        }
    }

    {
        let mut map = state.clients.write().unwrap();
        map.remove(&id);
    }

    forward.abort();
}

fn broadcast(state: &WsState, from: &str, raw: String) {
    let frame = Message::Text(raw);
    let map = state.clients.read().unwrap();
    for (id, tx) in map.iter() {
        if id == from { continue; }
        let _ = tx.send(frame.clone());
    }
}