use axum::{
    response::Html,
    routing::post,
    routing::{get, get_service},
    Json, Router,
};
use serde::{Deserialize, Serialize};
use tower_http::services::ServeDir;

#[derive(Deserialize)]
struct MyInputs {
    x: f64,
    y: f64,
}

#[derive(Serialize)]
struct MyOutputs {
    z: f64,
}

fn do_calc(my_input: MyInputs) -> MyOutputs {
    MyOutputs {
        z: my_input.x + my_input.y,
    }
}

#[tokio::main]
async fn main() {
    // build our application with a route

    let app = Router::new()
        .route("/", get(index_handler))
        .route("/calc", post(calc_handler))
        .nest_service("/assets", get_service(ServeDir::new("assets")));

    // run it
    let listener = tokio::net::TcpListener::bind("127.0.0.1:4000")
        .await
        .unwrap();
    println!("listening on {}", listener.local_addr().unwrap());
    axum::serve(listener, app).await.unwrap();
}

async fn index_handler() -> Html<&'static str> {
    Html(include_str!("index.html"))
}

async fn calc_handler(Json(my_input): Json<MyInputs>) -> Json<MyOutputs> {
    Json(do_calc(my_input))
}
