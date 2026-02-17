#!/bin/bash
# Check pending withdrawals using Supabase REST API (Hardcoded creds)

SUPABASE_URL="https://wrruwhauyttrbgjrkcje.supabase.co"
SUPABASE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndycnV3aGF1eXR0cmJnanJrY2plIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzA3NzI4MywiZXhwIjoyMDgyNjUzMjgzfQ.7F9-zr3AbUw8HLdzkS8v4v_qmk5NL-n-dN9yzp_sDLM"

echo "Checking pending withdrawals..."

# Get count of pending withdrawals
# Using HEAD request to get count from Content-Range header
COUNT=$(curl -s -I -X GET "$SUPABASE_URL/rest/v1/withdrawal_requests?status=eq.pending" \
  -H "apikey: $SUPABASE_KEY" \
  -H "Authorization: Bearer $SUPABASE_KEY" \
  -H "Range: 0-0" \
  -H "Prefer: count=exact" | grep -i "content-range" | cut -d '/' -f2 | tr -d '\r')

echo "PENDING_COUNT: ${COUNT:-0}"

if [ "${COUNT:-0}" -ne "0" ] && [ "${COUNT:-0}" -ne "" ]; then
  echo "Oldest pending withdrawals:"
  curl -s -X GET "$SUPABASE_URL/rest/v1/withdrawal_requests?status=eq.pending&select=id,user_id,wld_amount,created_at&order=created_at.asc&limit=5" \
    -H "apikey: $SUPABASE_KEY" \
    -H "Authorization: Bearer $SUPABASE_KEY"
  echo ""
fi
