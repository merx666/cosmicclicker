#!/bin/bash
# ===========================================
# Void Collector Anti-Abuse Monitor
# Runs via cron every 5 minutes
# AUTOMATICALLY detects, bans, and resets exploiters
# ===========================================

LOG_FILE="/var/log/void-antiabuse.log"
DB_NAME="void_collector"

# Thresholds
MAX_PAYOUTS_PER_DAY=5              # Max payouts per user per day (Increased from 3)
MAX_PENDING_PER_USER=7             # Max pending requests per user (Increased from 5)
SUSPICIOUS_PARTICLES=13500000      # 13.5M particles = auto-ban (Increased from 10M)
MAX_PARTICLES_PER_HOUR=135000      # 135k/hour max legit gain (Increased from 100k)

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> "$LOG_FILE"
}

ban_wallet() {
    local wallet="$1"
    local reason="$2"
    
    # Reset particles to 0
    sudo -u postgres psql -d $DB_NAME -q -c "
        UPDATE users SET particles = 0, total_particles_collected = 0 
        WHERE world_id_nullifier = '$wallet'
    "
    
    # Reject all pending payouts
    sudo -u postgres psql -d $DB_NAME -q -c "
        UPDATE withdrawal_requests 
        SET status = 'rejected', admin_note = '$reason'
        WHERE wallet_address = '$wallet' AND status = 'pending'
    "
    
    log "🔨 BANNED: $wallet - Reason: $reason"
}

log "=== Anti-Abuse Scan Started ==="

# 1. AUTO-BAN: Users with excessive payouts today (>3 per day)
ABUSERS=$(sudo -u postgres psql -d $DB_NAME -t -A -c "
    SELECT wallet_address, COUNT(*) as cnt 
    FROM withdrawal_requests 
    WHERE status IN ('pending', 'paid') 
      AND created_at > NOW() - INTERVAL '24 hours'
    GROUP BY wallet_address 
    HAVING COUNT(*) > $MAX_PAYOUTS_PER_DAY
")

if [ -n "$ABUSERS" ]; then
    log "⚠️ PAYOUT ABUSE DETECTED:"
    while IFS='|' read -r wallet count; do
        [ -z "$wallet" ] && continue
        log "  → $wallet: $count payouts in 24h"
        ban_wallet "$wallet" "Auto-banned: $count payouts in 24h (limit: $MAX_PAYOUTS_PER_DAY)"
    done <<< "$ABUSERS"
fi

# 2. AUTO-BAN: Users with too many pending requests
PENDING_ABUSERS=$(sudo -u postgres psql -d $DB_NAME -t -A -c "
    SELECT wallet_address, COUNT(*) as cnt 
    FROM withdrawal_requests 
    WHERE status = 'pending'
    GROUP BY wallet_address 
    HAVING COUNT(*) > $MAX_PENDING_PER_USER
")

if [ -n "$PENDING_ABUSERS" ]; then
    log "⚠️ QUEUE ABUSE DETECTED:"
    while IFS='|' read -r wallet count; do
        [ -z "$wallet" ] && continue
        log "  → $wallet: $count pending requests"
        ban_wallet "$wallet" "Auto-banned: queue abuse ($count pending)"
    done <<< "$PENDING_ABUSERS"
fi

# 3. AUTO-BAN: Users with impossible particle counts (>10M = hacking)
HACKERS=$(sudo -u postgres psql -d $DB_NAME -t -A -c "
    SELECT world_id_nullifier, total_particles_collected 
    FROM users 
    WHERE total_particles_collected > $SUSPICIOUS_PARTICLES
      AND particles > 0
")

if [ -n "$HACKERS" ]; then
    log "🚨 PARTICLE EXPLOITATION DETECTED:"
    while IFS='|' read -r nullifier particles; do
        [ -z "$nullifier" ] && continue
        log "  → ${nullifier:0:20}...: $particles particles (IMPOSSIBLE)"
        ban_wallet "$nullifier" "Auto-banned: particle exploitation ($particles collected)"
    done <<< "$HACKERS"
fi

# 4. Generate summary
TOTAL_PENDING=$(sudo -u postgres psql -d $DB_NAME -t -A -c "SELECT COUNT(*) FROM withdrawal_requests WHERE status = 'pending'")
TOTAL_PAID_TODAY=$(sudo -u postgres psql -d $DB_NAME -t -A -c "SELECT COALESCE(SUM(wld_amount), 0) FROM withdrawal_requests WHERE status = 'paid' AND processed_at > NOW() - INTERVAL '24 hours'")
TOTAL_REJECTED_TODAY=$(sudo -u postgres psql -d $DB_NAME -t -A -c "SELECT COUNT(*) FROM withdrawal_requests WHERE status = 'rejected' AND created_at > NOW() - INTERVAL '24 hours'")
TOTAL_USERS=$(sudo -u postgres psql -d $DB_NAME -t -A -c "SELECT COUNT(*) FROM users")

log "📊 Summary: Users=$TOTAL_USERS | Pending=$TOTAL_PENDING | Paid today=$TOTAL_PAID_TODAY WLD | Rejected today=$TOTAL_REJECTED_TODAY"
log "=== Scan Complete ==="
