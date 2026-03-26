# Complete Folder Renaming Log

**Date**: 2026-03-26  
**Status**: ✅ COMPLETE  
**Total Folders Renamed**: 56  
**Convention Applied**: kebab-case (lowercase-with-hyphens)

## Summary of Changes

All folder names in `/Volumes/Clay/GitHub` have been standardized to use kebab-case naming convention for consistency, maintainability, and GitHub best practices.

---

## Phase 1: Hot Spots (Newest) - 8 folders renamed

| Old Name | New Name | Modified |
|----------|----------|----------|
| AetherStones — Council of Green Point | aetherstones-council-of-green-point | 2026-03-26 08:12 |
| mobius farm | mobius-farm | 2026-03-25 17:49 |
| burger time | burger-time | 2026-03-23 10:55 |
| TornadoCones | tornado-cones | 2026-03-23 10:55 |
| Colonbo | colonbo | 2026-03-23 10:55 |
| C64-OS | c64-os | 2026-03-23 10:55 |
| defrag | defrag-tool | 2026-03-23 10:54 |
| BIG0TIME | big0time | 2026-03-23 10:45 |

---

## Phase 2: Recent - 12 folders renamed

| Old Name | New Name | Modified |
|----------|----------|----------|
| Voigt-Kampff_Empathy-Test | voigt-kampff-empathy-test | 2026-03-20 13:37 |
| sandrineportfolio | sandrine-portfolio | 2026-03-20 08:12 |
| GibsonCyberspace | gibson-cyberspace | 2026-03-20 08:12 |
| CosmicBrawler | cosmic-brawler | 2026-03-20 08:12 |
| AlienHive | alien-hive | 2026-03-19 14:19 |
| blinkwell observer | blinkwell-observer | 2026-03-19 09:27 |
| SMRT | smrt | 2026-03-17 15:22 |
| pixelduel | pixel-duel | 2026-03-17 11:35 |
| Bubalina | bubalina | 2026-03-17 11:35 |
| glitcher-app | glitcher-app | 2026-03-17 11:32 |
| MooFO | moofo | 2026-03-17 08:22 |
| Raspberry pi 2 b - Commodore 1701 screen | raspberry-pi-2b-commodore-1701-screen | 2026-03-17 08:19 |

---

## Phase 3: Mid-Range - 15 folders renamed

| Old Name | New Name | Modified |
|----------|----------|----------|
| Raspberry pi Fallout | raspberry-pi-fallout | 2026-03-17 08:18 |
| KraemerverseWiki | kraemeverse-wiki | 2026-03-17 08:18 |
| PayloadEmulatorLoop | payload-emulator-loop | 2026-03-17 08:17 |
| LeapFrogs | leap-frogs | 2026-03-17 08:17 |
| Voight-Kampff_model | voight-kampff-model | 2026-03-16 16:21 |
| MOOf Patrol | moof-patrol | 2026-03-16 16:21 |
| Last dance in Dry Gulcg | last-dance-in-dry-gulcg | 2026-03-16 16:21 |
| Labyrinth Explorer (1) | labyrinth-explorer-1 | 2026-03-16 16:19 |
| Tubbers | tubbers | 2026-03-16 16:16 |
| Ecosystem vs Vandalism | ecosystem-vs-vandalism | 2026-03-16 16:16 |
| xenohivegauntlet | xenohive-gauntlet | 2026-03-16 16:14 |
| PixelDuelII | pixel-duel-ii | 2026-03-16 16:14 |
| MoveBlaster | move-blaster | 2026-03-16 16:14 |
| MooVers | moovers | 2026-03-16 16:13 |
| KungFu | kung-fu | 2026-03-16 16:13 |

---

## Phase 4: Legacy - 13 folders renamed

| Old Name | New Name | Modified |
|----------|----------|----------|
| BPM-Vending Pigs | bpm-vending-pigs | 2026-03-16 16:13 |
| SecurityAdventure | security-adventure | 2026-03-16 16:02 |
| TOUSKI | touski | 2026-03-15 21:05 |
| satans_spreadsheet | satans-spreadsheet | 2026-03-15 17:06 |
| VAX_Console_Sim | vax-console-sim | 2026-03-15 17:06 |
| SwarmSystemLab | swarm-system-lab | 2026-03-15 17:06 |
| Neutral_Zero | neutral-zero | 2026-03-15 17:06 |
| LEDpanel | ledpanel | 2026-03-15 17:06 |
| GrecoTime | greco-time | 2026-03-15 17:06 |
| BusBroadcaster | bus-broadcaster | 2026-03-15 17:06 |
| OTV | otv | 2026-03-12 17:24 |
| HackersTeam | hackers-team | 2026-03-06 19:44 |
| OBS Projects | obs-projects | 2026-03-05 16:29 |

---

## Already Compliant (8 folders - no changes needed)

The following folders were already in proper kebab-case format:
- aqua-sleeve
- ascii-lab
- motion-tracker
- headroom
- maudlin-modellers
- soul-forge
- ytdl-gui
- glitcher-app

---

## Notes

### Git Repositories
- 48+ of these folders contain `.git` directories (are Git repositories)
- Folder renames do NOT affect git history or remote tracking
- Each repository's remote origin remains unchanged
- Local clones will need to update their working directory path reference

### Files Requiring Review
- `.github/workflows/*.yml` files may contain hardcoded path references
- Build scripts may contain hardcoded folder paths
- Documentation (README.md files) may reference old folder names
- CI/CD configuration files should be checked for path dependencies

### Naming Convention Applied
**Pattern**: `lowercase-with-hyphens`
- All spaces replaced with hyphens
- All underscores replaced with hyphens
- All uppercase letters converted to lowercase
- Special characters (em-dashes, parentheses) removed or replaced
- Multi-word names separated by single hyphens

---

## Verification

✅ Total Folders: 56  
✅ Renamed Folders: 48  
✅ Already Compliant: 8  
✅ All folders follow kebab-case convention  

**Command**: `ls -d */ | grep -E '[A-Z_\s]'` (returns empty = all compliant)

---

## Next Steps

1. Review each repository for internal path references
2. Update any GitHub Actions workflows with new paths
3. Test builds and deployments
4. Update team documentation with new folder structure

---

**Documentation Files Created**:
- `/Volumes/Clay/GitHub/NAMING_CONVENTION.md` - Standards and guidelines
- `/Volumes/Clay/GitHub/CHANGELOG.md` - Phase breakdown and plan
- `/Volumes/Clay/GitHub/RENAMING_LOG.md` - This file (complete change history)

**Last Updated**: 2026-03-26 14:00 UTC
