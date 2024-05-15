FROM rust
WORKDIR /usr/src/myapp
COPY . .
RUN cargo build
