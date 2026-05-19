#!/bin/bash
# ─────────────────────────────────────────────────────────────────
# validate.sh
# Validates a workplans directory against the v0.2.1 format.
#
# Usage: ./scripts/validate.sh <workplans-dir>
#
# Checks:
#   1. Frontmatter: id first field, required fields, state matches folder
#   2. Template: allowed sections only, no deprecated sections
#   3. File naming: YYDDDsssss_description.md pattern
#   4. Structure: RULES.md exists with version/work_on fields, READMEs exist, no unexpected files
# ─────────────────────────────────────────────────────────────────

set -e

WORKPLANS_DIR="${1:-.}"
errors=0
warnings=0
checked=0

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
NC='\033[0m'

fail() {
  echo -e "  ${RED}FAIL${NC} $1"
  errors=$((errors + 1))
}

warn() {
  echo -e "  ${YELLOW}WARN${NC} $1"
  warnings=$((warnings + 1))
}

pass() {
  echo -e "  ${GREEN}PASS${NC} $1"
}

# ─── Helpers ──────────────────────────────────────────────────────
get_field() {
  grep "^${2}:" "$1" 2>/dev/null | head -1 | sed 's/^[^:]*: *//' | sed 's/^"//;s/"$//' | sed "s/^'//;s/'$//"
}

get_first_field() {
  # Get the first field name after the opening ---
  sed -n '2p' "$1" | sed 's/:.*//'
}

get_h1() {
  grep "^# " "$1" | head -1 | sed 's/^# //'
}

get_sections() {
  grep "^## " "$1" | sed 's/^## //'
}

# ─── Structure validation ────────────────────────────────────────
echo ""
echo "=== Structure validation ==="

# Check RULES.md
if [[ -f "$WORKPLANS_DIR/RULES.md" ]]; then
  pass "RULES.md exists"

  # Check RULES.md frontmatter fields
  rules_version=$(get_field "$WORKPLANS_DIR/RULES.md" "version")
  if [[ -n "$rules_version" ]]; then
    pass "RULES.md — version field present ($rules_version)"
  else
    fail "RULES.md — missing version field"
  fi

  rules_work_on=$(get_field "$WORKPLANS_DIR/RULES.md" "work_on")
  if [[ -n "$rules_work_on" ]]; then
    pass "RULES.md — work_on field present ($rules_work_on)"
  else
    warn "RULES.md — missing work_on field (defaults to \".\")"
  fi
else
  fail "RULES.md not found"
fi

# Check state folders
for folder in backlog doing done; do
  if [[ -d "$WORKPLANS_DIR/$folder" ]]; then
    pass "$folder/ exists"
  else
    fail "$folder/ not found"
  fi
done

# Check READMEs
if [[ -f "$WORKPLANS_DIR/README.md" ]]; then
  pass "Root README.md exists"
else
  fail "Root README.md not found"
fi

for folder in backlog doing done; do
  if [[ -f "$WORKPLANS_DIR/$folder/README.md" ]]; then
    pass "$folder/README.md exists"
  else
    fail "$folder/README.md not found"
  fi
done

# ─── File naming validation ──────────────────────────────────────
echo ""
echo "=== File naming validation ==="

id_list=""

for folder in backlog doing done; do
  dir="$WORKPLANS_DIR/$folder"
  [[ ! -d "$dir" ]] && continue

  for file in "$dir"/*.md; do
    [[ ! -f "$file" ]] && continue
    bn=$(basename "$file")
    [[ "$bn" == "README.md" ]] && continue

    checked=$((checked + 1))

    # Check naming pattern
    if [[ "$bn" =~ ^([0-9]{10})_([a-z0-9-]+)\.md$ ]]; then
      file_id="${BASH_REMATCH[1]}"
      pass "$folder/$bn — naming OK"

      # Check for duplicate IDs
      if echo "$id_list" | grep -q "^${file_id}:"; then
        existing=$(echo "$id_list" | grep "^${file_id}:" | head -1 | cut -d: -f2-)
        fail "$folder/$bn — duplicate ID $file_id (also in $existing)"
      else
        id_list="${id_list}${file_id}:${folder}/${bn}"$'\n'
      fi
    elif [[ "$bn" =~ ^(DRAFT|BACKLOG|DOING|DONE)- ]]; then
      fail "$folder/$bn — old v0.1.0 naming format"
    else
      fail "$folder/$bn — does not match {YYDDDsssss}_{description}.md pattern"
    fi
  done
done

# ─── Frontmatter validation ──────────────────────────────────────
echo ""
echo "=== Frontmatter validation ==="

for folder in backlog doing done; do
  dir="$WORKPLANS_DIR/$folder"
  [[ ! -d "$dir" ]] && continue

  for file in "$dir"/*.md; do
    [[ ! -f "$file" ]] && continue
    bn=$(basename "$file")
    [[ "$bn" == "README.md" ]] && continue

    # Check frontmatter exists
    first_line=$(head -1 "$file")
    if [[ "$first_line" != "---" ]]; then
      fail "$folder/$bn — no frontmatter (first line is not ---)"
      continue
    fi

    # Check id is first field
    first_field=$(get_first_field "$file")
    if [[ "$first_field" == "id" ]]; then
      pass "$folder/$bn — id is first field"
    else
      fail "$folder/$bn — id is not first field (found: $first_field)"
    fi

    # Check id matches filename
    fm_id=$(get_field "$file" "id")
    if [[ "$bn" =~ ^([0-9]{10})_ ]]; then
      file_id="${BASH_REMATCH[1]}"
      if [[ "$fm_id" == "$file_id" ]]; then
        pass "$folder/$bn — id matches filename"
      else
        fail "$folder/$bn — id mismatch: frontmatter=$fm_id filename=$file_id"
      fi
    fi

    # Check state matches folder
    fm_state=$(get_field "$file" "state")
    if [[ "$fm_state" == "$folder" ]]; then
      pass "$folder/$bn — state matches folder"
    else
      fail "$folder/$bn — state mismatch: frontmatter=$fm_state folder=$folder"
    fi

    # Check required fields exist
    for field in title state author author_model assignee assignee_model backlog_date doing_date done_date format_version; do
      if ! grep -q "^${field}:" "$file"; then
        fail "$folder/$bn — missing field: $field"
      fi
    done

    # Check H1 matches title field
    plan_title=$(get_field "$file" "title")
    h1_title=$(get_h1 "$file")
    if [[ "$plan_title" == "$h1_title" ]]; then
      pass "$folder/$bn — H1 matches title field"
    else
      fail "$folder/$bn — H1 mismatch: title='$plan_title' H1='$h1_title'"
    fi
  done
done

# ─── Template structure validation ────────────────────────────────
echo ""
echo "=== Template structure validation ==="

ALLOWED_SECTIONS="Progress Objective Context Implementation Closing Summary"
DEPRECATED_SECTIONS="Verification Risks Comments"

for folder in backlog doing done; do
  dir="$WORKPLANS_DIR/$folder"
  [[ ! -d "$dir" ]] && continue

  for file in "$dir"/*.md; do
    [[ ! -f "$file" ]] && continue
    bn=$(basename "$file")
    [[ "$bn" == "README.md" ]] && continue

    sections=$(get_sections "$file")

    # Check for deprecated sections
    while IFS= read -r section; do
      [[ -z "$section" ]] && continue
      for dep in $DEPRECATED_SECTIONS; do
        if [[ "$section" == "$dep" ]]; then
          fail "$folder/$bn — deprecated section: ## $dep"
        fi
      done
    done <<< "$sections"

    # Check all 5 required sections present and in order
    expected_order=("Progress" "Objective" "Context" "Implementation" "Closing Summary")
    section_array=()
    while IFS= read -r s; do
      [[ -n "$s" ]] && section_array+=("$s")
    done <<< "$sections"

    # Check each required section is present
    all_present=true
    for expected in "${expected_order[@]}"; do
      found=false
      for actual in "${section_array[@]}"; do
        if [[ "$actual" == "$expected" ]]; then
          found=true
          break
        fi
      done
      if $found; then
        pass "$folder/$bn — section '$expected' present"
      else
        fail "$folder/$bn — missing required section: ## $expected"
        all_present=false
      fi
    done

    # Check order (only if all present)
    if $all_present; then
      idx=0
      in_order=true
      for expected in "${expected_order[@]}"; do
        # Find position of this expected section in actual array
        pos=-1
        for i in "${!section_array[@]}"; do
          if [[ "${section_array[$i]}" == "$expected" ]]; then
            pos=$i
            break
          fi
        done
        if [[ $pos -lt $idx ]]; then
          in_order=false
          break
        fi
        idx=$pos
      done
      if $in_order; then
        pass "$folder/$bn — sections in correct order"
      else
        actual_order=$(printf ", %s" "${section_array[@]}")
        fail "$folder/$bn — sections out of order: [${actual_order:2}]"
      fi
    fi

    # Check Phase 1 exists (title after colon follows user's language)
    if grep -q "### Phase 1:" "$file"; then
      pass "$folder/$bn — Phase 1 present"
    else
      fail "$folder/$bn — missing mandatory Phase 1"
    fi

    # Check Closing phase exists (last phase, title follows user's language)
    # Get the last ### Phase N: heading and check it's the closing phase
    last_phase=$(grep "### Phase [0-9]*:" "$file" | tail -1)
    if [[ -n "$last_phase" ]]; then
      pass "$folder/$bn — Closing phase present"
    else
      fail "$folder/$bn — missing mandatory Closing phase"
    fi
  done
done

# ─── Emoji validation ────────────────────────────────────────────
echo ""
echo "=== Emoji validation ==="

for folder in backlog doing done; do
  dir="$WORKPLANS_DIR/$folder"
  [[ ! -d "$dir" ]] && continue

  for file in "$dir"/*.md; do
    [[ ! -f "$file" ]] && continue
    bn=$(basename "$file")
    [[ "$bn" == "README.md" ]] && continue

    # Detect emojis using a broad Unicode emoji range (perl for cross-platform PCRE support)
    if perl -CSD -ne 'BEGIN{$f=0} $f=1 if /[\x{1F300}-\x{1F9FF}\x{2600}-\x{26FF}\x{2700}-\x{27BF}\x{FE00}-\x{FE0F}\x{1FA00}-\x{1FA6F}\x{1FA70}-\x{1FAFF}\x{200D}\x{20E3}\x{E0020}-\x{E007F}]/; END{exit($f?0:1)}' "$file" 2>/dev/null; then
      fail "$folder/$bn — contains emojis (rule 24: use plain descriptive text instead)"
    else
      pass "$folder/$bn — no emojis"
    fi
  done
done

# ─── Summary ─────────────────────────────────────────────────────
echo ""
echo "=== Results ==="
echo "  Plans checked: $checked"
echo -e "  Errors:        ${RED}${errors}${NC}"
echo -e "  Warnings:      ${YELLOW}${warnings}${NC}"
echo ""

if [[ "$errors" -eq 0 ]]; then
  echo -e "${GREEN}All checks passed.${NC}"
  exit 0
else
  echo -e "${RED}Validation failed with $errors error(s).${NC}"
  exit 1
fi
