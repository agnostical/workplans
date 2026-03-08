#!/bin/bash
# ─────────────────────────────────────────────────────────────────
# validate.sh
# Validates a workplans directory against the v0.2.0 format.
#
# Usage: ./scripts/validate.sh <workplans-dir>
#
# Checks:
#   1. Frontmatter: id first field, required fields, state matches folder
#   2. Template: allowed sections only, no deprecated sections
#   3. File naming: YYDDDsssss_description.md pattern
#   4. Structure: RULES.md exists, READMEs exist, no unexpected files
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
else
  fail "RULES.md not found"
fi

# Check state folders
for folder in backlog doing done draft; do
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

for folder in backlog doing done draft; do
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

for folder in draft backlog doing done; do
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

for folder in draft backlog doing done; do
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
    for field in title state author author_model assignee assignee_model issue draft_date backlog_date doing_date done_date; do
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

for folder in draft backlog doing done; do
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

    # Check Progress § is first section
    first_section=$(echo "$sections" | head -1)
    if [[ "$first_section" == "Progress §" ]]; then
      pass "$folder/$bn — Progress § is first section"
    else
      fail "$folder/$bn — first section is '$first_section' (expected 'Progress §')"
    fi

    # Check Closing Summary § exists
    if echo "$sections" | grep -q "Closing Summary §"; then
      pass "$folder/$bn — Closing Summary present"
    else
      fail "$folder/$bn — missing Closing Summary section"
    fi
  done
done

# ─── Index validation ────────────────────────────────────────────
echo ""
echo "=== Index validation ==="

# Validate state folder READMEs
for folder in draft backlog doing done; do
  dir="$WORKPLANS_DIR/$folder"
  readme="$dir/README.md"
  [[ ! -d "$dir" ]] && continue
  [[ ! -f "$readme" ]] && continue

  # Count actual plan files
  actual_count=0
  actual_ids=""
  for file in "$dir"/*.md; do
    [[ ! -f "$file" ]] && continue
    bn=$(basename "$file")
    [[ "$bn" == "README.md" ]] && continue
    actual_count=$((actual_count + 1))
    if [[ "$bn" =~ ^([0-9]{10})_ ]]; then
      actual_ids="${actual_ids}${BASH_REMATCH[1]}"$'\n'
    fi
  done

  # Check count in H1
  readme_count=$(head -1 "$readme" | grep -o '[0-9]\+' | head -1)
  readme_count="${readme_count:-0}"
  if [[ "$actual_count" -eq "$readme_count" ]]; then
    pass "$folder/README.md — count matches ($actual_count)"
  else
    fail "$folder/README.md — count mismatch: README says $readme_count, actual $actual_count"
  fi

  # Check every plan file has a row in the README
  for file in "$dir"/*.md; do
    [[ ! -f "$file" ]] && continue
    bn=$(basename "$file")
    [[ "$bn" == "README.md" ]] && continue
    if grep -q "$bn" "$readme"; then
      pass "$folder/README.md — lists $bn"
    else
      fail "$folder/README.md — missing row for $bn"
    fi
  done

  # Check for orphan rows (README references files that don't exist)
  grep -oE '[0-9]{10}_[a-z0-9-]+\.md' "$readme" | while read -r linked; do
    if [[ ! -f "$dir/$linked" ]]; then
      fail "$folder/README.md — orphan row: $linked not found"
    fi
  done
done

# Validate root README
root_readme="$WORKPLANS_DIR/README.md"
if [[ -f "$root_readme" ]]; then
  echo ""
  echo "  --- Root README ---"

  for folder in backlog doing done draft; do
    dir="$WORKPLANS_DIR/$folder"
    [[ ! -d "$dir" ]] && continue

    # Count actual plans
    actual_count=0
    for file in "$dir"/*.md; do
      [[ ! -f "$file" ]] && continue
      bn=$(basename "$file")
      [[ "$bn" == "README.md" ]] && continue
      actual_count=$((actual_count + 1))
    done

    # Extract count from the summary table (row with numbers)
    # Table order: Backlog | Doing | Done | Draft
    case "$folder" in
      backlog) col=1 ;;
      doing)   col=2 ;;
      done)    col=3 ;;
      draft)   col=4 ;;
    esac
    # The summary row is the line after the alignment row |:---..
    summary_line=$(grep -A1 '|:--' "$root_readme" | tail -1)
    root_count=$(echo "$summary_line" | awk -F'|' -v c=$((col + 1)) '{gsub(/ /,"",$c); print $c}')
    root_count="${root_count:-0}"

    if [[ "$actual_count" -eq "$root_count" ]]; then
      pass "Root README — $folder count matches ($actual_count)"
    else
      fail "Root README — $folder count mismatch: README says $root_count, actual $actual_count"
    fi

    # Check plan rows in root README (plans listed under H2 sections)
    for file in "$dir"/*.md; do
      [[ ! -f "$file" ]] && continue
      bn=$(basename "$file")
      [[ "$bn" == "README.md" ]] && continue
      if grep -q "$bn" "$root_readme"; then
        pass "Root README — lists $folder/$bn"
      else
        fail "Root README — missing row for $folder/$bn"
      fi
    done
  done

  # Check for orphan rows in root README
  grep -oE '[a-z]+/[0-9]{10}_[a-z0-9-]+\.md' "$root_readme" | while read -r linked; do
    if [[ ! -f "$WORKPLANS_DIR/$linked" ]]; then
      fail "Root README — orphan row: $linked not found"
    fi
  done
fi

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
