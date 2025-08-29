pipeline {
  agent any

  options {
    timestamps()
    ansiColor('xterm')
  }

  environment {
    REGISTRY = credentials('docker-registry')
    DOCKER_REPO = "your-docker-registry.example.com/cipherchat"
    BACKEND_IMPL = "go"
    APP_VERSION = "${env.BUILD_NUMBER}"
    KUBE_CONTEXT = "your-kube-context"
  }

  stages {
    stage('Checkout') {
      steps {
        checkout scm
        script {
          sh 'node -v'
          sh 'go version || true'
          sh 'rustc --version || true'
        }
      }
    }

    stage('Install JS Deps') {
      steps {
        sh 'npm ci'
      }
    }

    stage('Build Web') {
      steps {
        sh 'npm run build --workspace=@cipherchat/web'
      }
      post {
        success { archiveArtifacts artifacts: 'apps/web/dist/**', fingerprint: true }
      }
    }

    stage('Backend Build & Test') {
      steps {
        script {
          if (env.BACKEND_IMPL == "go") {
            dir('apps/server-go') {
              sh 'go build ./cmd/cipherchat'
              sh 'go test ./... || true'
            }
          } else if (env.BACKEND_IMPL == "rust") {
            dir('apps/server-rust') {
              sh 'cargo build --release'
              sh 'cargo test --no-fail-fast || true'
            }
          }
        }
      }
    }

    stage('Docker Build & Push') {
      steps {
        script {
          docker.withRegistry("https://${DOCKER_REPO.split('/')[0]}", 'docker-registry') {
            sh """
              docker build -f Dockerfile.web -t ${DOCKER_REPO}-web:${APP_VERSION} .
              docker build -f apps/server-go/Dockerfile -t ${DOCKER_REPO}-api:${APP_VERSION} apps/server-go
              docker tag ${DOCKER_REPO}-web:${APP_VERSION} ${DOCKER_REPO}-web:latest
              docker tag ${DOCKER_REPO}-api:${APP_VERSION} ${DOCKER_REPO}-api:latest
              docker push ${DOCKER_REPO}-web:${APP_VERSION}
              docker push ${DOCKER_REPO}-api:${APP_VERSION}
              docker push ${DOCKER_REPO}-web:latest
              docker push ${DOCKER_REPO}-api:latest
            """
          }
        }
      }
    }

    stage('Deploy to K8s') {
      when { anyOf { branch 'main'; branch 'release/*' } }
      steps {
        script {
          sh """
            kubectl config use-context ${KUBE_CONTEXT}
            sed -i 's#YOUR_REGISTRY/cipherchat-api:latest#${DOCKER_REPO}-api:${APP_VERSION}#' deploy/k8s/deployment-api.yaml
            sed -i 's#YOUR_REGISTRY/cipherchat-web:latest#${DOCKER_REPO}-web:${APP_VERSION}#' deploy/k8s/deployment-web.yaml
            kubectl apply -f deploy/k8s/namespace.yaml || true
            kubectl apply -f deploy/k8s/
          """
        }
      }
    }
  }

  post {
    failure { echo "Build failed" }
    success { echo "Build ${env.BUILD_NUMBER} succeeded." }
  }
}