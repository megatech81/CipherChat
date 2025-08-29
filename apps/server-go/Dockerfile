FROM golang:1.22-alpine AS build
WORKDIR /src
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 go build -o /out/cipherchat-api ./cmd/cipherchat

FROM gcr.io/distroless/base-debian12
WORKDIR /app
COPY --from=build /out/cipherchat-api ./cipherchat-api
EXPOSE 8080
USER nonroot:nonroot
ENTRYPOINT ["./cipherchat-api"]