#!/bin/bash

# Script pour démarrer le scheduler en mode daemon
# Utilisation: ./start-scheduler-daemon.sh

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PID_FILE="$PROJECT_DIR/scheduler.pid"
LOG_FILE="$PROJECT_DIR/scheduler.log"

cd "$PROJECT_DIR"

# Fonction pour vérifier si le processus est en cours
is_running() {
  if [ -f "$PID_FILE" ]; then
    local pid=$(cat "$PID_FILE")
    if ps -p "$pid" > /dev/null 2>&1; then
      return 0
    else
      rm -f "$PID_FILE"
      return 1
    fi
  fi
  return 1
}

# Fonction pour démarrer le scheduler
start_scheduler() {
  if is_running; then
    echo "❌ Le scheduler est déjà en cours d'exécution (PID: $(cat $PID_FILE))"
    exit 1
  fi

  echo "🚀 Démarrage du scheduler en mode daemon..."
  
  # Démarrer en arrière-plan et capturer le PID
  nohup npm run scheduler:continuous > "$LOG_FILE" 2>&1 &
  local pid=$!
  
  echo "$pid" > "$PID_FILE"
  echo "✅ Scheduler démarré avec le PID: $pid"
  echo "📋 Logs disponibles dans: $LOG_FILE"
  echo "🛑 Pour arrêter: ./stop-scheduler-daemon.sh"
}

# Fonction pour arrêter le scheduler
stop_scheduler() {
  if ! is_running; then
    echo "❌ Le scheduler n'est pas en cours d'exécution"
    exit 1
  fi

  local pid=$(cat "$PID_FILE")
  echo "🛑 Arrêt du scheduler (PID: $pid)..."
  
  kill "$pid"
  rm -f "$PID_FILE"
  echo "✅ Scheduler arrêté"
}

# Fonction pour afficher le statut
show_status() {
  if is_running; then
    local pid=$(cat "$PID_FILE")
    echo "✅ Scheduler en cours d'exécution (PID: $pid)"
    echo "📋 Logs: $LOG_FILE"
    echo "📊 Dernières lignes du log:"
    tail -5 "$LOG_FILE" 2>/dev/null || echo "   Aucun log disponible"
  else
    echo "❌ Scheduler arrêté"
  fi
}

# Point d'entrée principal
case "${1:-start}" in
  start)
    start_scheduler
    ;;
  stop)
    stop_scheduler
    ;;
  restart)
    stop_scheduler 2>/dev/null || true
    sleep 2
    start_scheduler
    ;;
  status)
    show_status
    ;;
  logs)
    if [ -f "$LOG_FILE" ]; then
      tail -f "$LOG_FILE"
    else
      echo "❌ Fichier de log non trouvé: $LOG_FILE"
    fi
    ;;
  *)
    echo "Usage: $0 {start|stop|restart|status|logs}"
    echo ""
    echo "Commandes:"
    echo "  start    - Démarrer le scheduler en arrière-plan"
    echo "  stop     - Arrêter le scheduler"
    echo "  restart  - Redémarrer le scheduler"
    echo "  status   - Afficher le statut du scheduler"
    echo "  logs     - Suivre les logs en temps réel"
    exit 1
    ;;
esac 