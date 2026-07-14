#!/bin/bash
# ─────────────────────────────────────────────────────────────────
# validate.sh
# Validates a workplans directory. Format-aware: applies the rule set
# matching each plan's declared format (`format`, or its pre-0.4.0
# alias `format_version`): 0.2.x legacy layout (Progress above
# Objective), 0.3.x new layout (Objective above Progress), 0.4.0
# frontmatter (format first, triage fields, tracked_in, relations).
#
# Usage: ./scripts/validate.sh <workplans-dir>
#
# Checks:
#   1. Frontmatter: first field, required fields and order per format,
#      state matches folder, triage/relations value sets
#   2. Template: allowed sections only, no deprecated sections,
#      section order matches the format layout, Closing Summary
#      leader paragraph on 0.4.0+ done plans
#   3. File naming: YYDDDsssss_description.md pattern
#   4. Structure: RULES.md exists with version field, READMEs exist,
#      no foreign subfolders
#   5. Encoding: valid UTF-8, heuristic orthography warnings (accent
#      dropping in Spanish content)
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
# Extract a frontmatter field. Only searches between the opening ---
# and the next ---, so YAML-looking code blocks in the body are not
# mistaken for frontmatter.
get_field() {
  awk -v field="$2" '
    NR == 1 && /^---$/ { in_fm = 1; next }
    in_fm && /^---$/ { exit }
    in_fm && $1 == field":" {
      sub(/^[^:]+: */, "")
      gsub(/^["'\'']|["'\'']$/, "")
      print
      exit
    }
  ' "$1" 2>/dev/null
}

# Returns 0 if version $1 >= $2 (uses sort -V for natural version order)
version_ge() {
  [[ "$1" == "$2" ]] && return 0
  [[ "$(printf '%s\n%s\n' "$1" "$2" | sort -V | head -n 1)" == "$2" ]]
}

# Declared plan format: `format` (0.4.0+) with `format_version` as read-alias
get_format() {
  local f
  f=$(get_field "$1" "format")
  [[ -z "$f" ]] && f=$(get_field "$1" "format_version")
  echo "$f"
}

get_first_field() {
  # Get the first field name after the opening ---
  sed -n '2p' "$1" | sed 's/:.*//'
}

# Top-level frontmatter field names in file order (indented sub-keys excluded)
get_fm_fields() {
  awk '
    NR == 1 && /^---$/ { in_fm = 1; next }
    in_fm && /^---$/ { exit }
    in_fm && /^[a-z_]+:/ { sub(/:.*/, ""); print }
  ' "$1" 2>/dev/null
}

# Indented sub-keys of relations
get_relations_keys() {
  awk '
    NR == 1 && /^---$/ { in_fm = 1; next }
    in_fm && /^---$/ { exit }
    in_fm && /^relations:/ { in_rel = 1; next }
    in_rel && /^[a-z_]+:/ { exit }
    in_rel && /^[ ]+[a-z_]+:/ { gsub(/^[ ]+/, ""); sub(/:.*/, ""); print }
  ' "$1" 2>/dev/null
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
  if [[ -n "$rules_version" ]] && version_ge "$rules_version" "0.4.0"; then
    if [[ -n "$rules_work_on" ]]; then
      warn "RULES.md — work_on moved to the root README frontmatter in 0.4.0"
    else
      pass "RULES.md — no work_on (project constants live in the root README)"
    fi
  else
    if [[ -n "$rules_work_on" ]]; then
      pass "RULES.md — work_on field present ($rules_work_on)"
    else
      warn "RULES.md — missing work_on field (defaults to \".\")"
    fi
  fi
else
  fail "RULES.md not found"
fi

# Check for foreign subfolders (rule 34: single-project layout)
for entry in "$WORKPLANS_DIR"/*/; do
  [[ ! -d "$entry" ]] && continue
  dname=$(basename "$entry")
  case "$dname" in
    backlog|doing|done|extend) ;;
    *) fail "Foreign subfolder in workplans/: $dname/ (rule 34: single-project layout)" ;;
  esac
done

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

    # Check first field per format: `format` in 0.4.0+, `id` before
    plan_format=$(get_format "$file")
    first_field=$(get_first_field "$file")
    if [[ -n "$plan_format" ]] && version_ge "$plan_format" "0.4.0"; then
      expected_first="format"
    else
      expected_first="id"
    fi
    if [[ "$first_field" == "$expected_first" ]]; then
      pass "$folder/$bn — $expected_first is first field"
    else
      fail "$folder/$bn — $expected_first is not first field (found: $first_field)"
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

    # Check required fields exist (set depends on format)
    if [[ -n "$plan_format" ]] && version_ge "$plan_format" "0.4.0"; then
      required_fields="format title priority estimate state author author_model assignee assignee_model backlog_date doing_date done_date tracked_in relations"
    else
      required_fields="format_version title state author author_model assignee assignee_model backlog_date doing_date done_date"
    fi
    for field in $required_fields; do
      if ! grep -q "^${field}:" "$file"; then
        fail "$folder/$bn — missing field: $field"
      fi
    done

    # 0.4.0 rule set: field order, triage values, relations types
    if [[ -n "$plan_format" ]] && version_ge "$plan_format" "0.4.0"; then
      expected_fields="format id title priority estimate author author_model assignee assignee_model state backlog_date doing_date done_date tracked_in relations"
      actual_fields=$(get_fm_fields "$file" | tr '\n' ' ' | sed 's/ *$//')
      if [[ "$actual_fields" == "$expected_fields" ]]; then
        pass "$folder/$bn — frontmatter fields in 0.4.0 order"
      else
        fail "$folder/$bn — frontmatter fields out of 0.4.0 order: [$actual_fields]"
      fi

      prio=$(get_field "$file" "priority")
      case "$prio" in
        urgent|high|medium|low|"") pass "$folder/$bn — priority value OK ('${prio}')" ;;
        *) fail "$folder/$bn — invalid priority: '$prio'" ;;
      esac

      est=$(get_field "$file" "estimate")
      scale=$(get_field "$WORKPLANS_DIR/README.md" "estimate_scale")
      [[ -z "$scale" ]] && scale="fibonacci"
      if [[ -n "$est" ]]; then
        case "$scale" in
          fibonacci) scale_tokens=" 1 2 3 5 8 13 21 " ;;
          tshirt)    scale_tokens=" xs s m l xl " ;;
          *)         scale_tokens="" ;;
        esac
        if [[ -z "$scale_tokens" ]]; then
          warn "$folder/$bn — unknown estimate_scale '$scale'; estimate not validated"
        elif [[ "$scale_tokens" == *" $est "* ]]; then
          pass "$folder/$bn — estimate '$est' valid in $scale scale"
        else
          fail "$folder/$bn — estimate '$est' not in $scale scale"
        fi
      fi

      while IFS= read -r rk; do
        [[ -z "$rk" ]] && continue
        case "$rk" in
          blocked_by|relates_to|supersedes|parent) pass "$folder/$bn — relations type '$rk' OK" ;;
          *) fail "$folder/$bn — invalid relations type: $rk" ;;
        esac
      done <<< "$(get_relations_keys "$file")"
    fi

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

    # Select expected section order based on the declared format
    plan_fv=$(get_format "$file")
    if [[ -n "$plan_fv" ]] && version_ge "$plan_fv" "0.3.0"; then
      expected_order=("Objective" "Progress" "Context" "Implementation" "Closing Summary")
      layout_label="new (format $plan_fv >= 0.3.0)"
    else
      expected_order=("Progress" "Objective" "Context" "Implementation" "Closing Summary")
      layout_label="legacy (format ${plan_fv:-unset} < 0.3.0)"
    fi
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
        pass "$folder/$bn — sections in correct order for $layout_label"
      else
        actual_order=$(printf ", %s" "${section_array[@]}")
        fail "$folder/$bn — sections out of order for $layout_label: [${actual_order:2}]"
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
    last_phase=$(grep "### Phase [0-9][0-9]*:" "$file" | tail -1)
    if [[ -n "$last_phase" ]]; then
      pass "$folder/$bn — Closing phase present"
    else
      fail "$folder/$bn — missing mandatory Closing phase"
    fi

    # Phase headings must carry a number: a literal "Phase N:" is template
    # imitation, not a valid heading
    if grep -qE "^#+ Phase [^0-9:]+:" "$file"; then
      fail "$folder/$bn — phase heading without a number (literal 'Phase N:'?)"
    fi

    # 0.4.0+ done plans: Closing Summary opens with the leader paragraph
    if [[ "$folder" == "done" ]] && [[ -n "$plan_fv" ]] && version_ge "$plan_fv" "0.4.0"; then
      cs_first=$(awk '/^## Closing Summary/{f=1;next} /^## /{f=0} f' "$file" | grep -v '^[[:space:]]*$' | head -1)
      if [[ -z "$cs_first" ]]; then
        fail "$folder/$bn — Closing Summary is empty in a done plan"
      elif [[ "$cs_first" == _* ]]; then
        fail "$folder/$bn — Closing Summary still has the placeholder in a done plan"
      elif [[ "$cs_first" == "#"* || "$cs_first" == "-"* || "$cs_first" == "*"* ]]; then
        fail "$folder/$bn — Closing Summary must open with the leader paragraph (found heading or bullet first)"
      else
        pass "$folder/$bn — Closing Summary leader paragraph present"

        # Leader length: 3-6 sentences (heuristic count, warning only)
        cs_leader=$(awk '/^## Closing Summary/{f=1;next} f && /^#/{exit} f && NF==0 && started{exit} f && NF>0{print; started=1}' "$file")
        n_sent=$(printf '%s' "$cs_leader" | perl -0777 -ne 'my $n = () = /[.!?](?=\s|$)/g; print $n' 2>/dev/null)
        if [[ -n "$n_sent" ]] && (( n_sent < 3 || n_sent > 6 )); then
          warn "$folder/$bn — leader paragraph has $n_sent sentence(s); the rule says 3-6"
        fi
      fi

      # Subsection labels must be H3 headings, not plain-text lines
      if awk '/^## Closing Summary/{f=1;next} /^## /{f=0} f' "$file" \
        | grep -qE '^(Delivered|Decisions|Verification|Deferred|References):?[[:space:]]*$'; then
        fail "$folder/$bn — Closing Summary label written as plain text; use an H3 heading (### Label)"
      fi
    fi
  done
done

# ─── Encoding and orthography validation ─────────────────────────
echo ""
echo "=== Encoding and orthography validation ==="

# Curated accent-dropped Spanish forms seen in real corpora (warnings only)
ORTHO_RE='\b([Dd]efinicion|[Ee]jecucion|[Vv]alidacion|[Ii]mplementacion|[Dd]escripcion|[Cc]onfiguracion|[Mm]igracion|[Cc]reacion|[Ii]ntegracion|[Dd]ocumentacion|[Ee]specificacion|[Ss]incronizacion|[Pp]arrafo|[Cc]ompactacion|[Rr]efinacion)\b'

for folder in backlog doing done; do
  dir="$WORKPLANS_DIR/$folder"
  [[ ! -d "$dir" ]] && continue

  for file in "$dir"/*.md; do
    [[ ! -f "$file" ]] && continue
    bn=$(basename "$file")
    [[ "$bn" == "README.md" ]] && continue

    if perl -e 'use Encode; local $/; open my $fh, "<:raw", $ARGV[0] or exit 1; my $d = <$fh>; eval { Encode::decode("UTF-8", $d, Encode::FB_CROAK) }; exit($@ ? 1 : 0)' "$file"; then
      pass "$folder/$bn — valid UTF-8"
    else
      fail "$folder/$bn — invalid UTF-8 encoding"
    fi

    ortho_hits=$(perl -CSD -ne "while (/$ORTHO_RE/g) { print \"\$1 \" }" "$file" 2>/dev/null | tr ' ' '\n' | sort -u | grep -v '^$' | tr '\n' ' ')
    if [[ -n "$ortho_hits" ]]; then
      warn "$folder/$bn — possible missing accents: ${ortho_hits% }"
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
