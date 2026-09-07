# VPS container image

This builds the image used by `!deploy vps`. Each qualifying user gets their own
container from this image, with its own SSH port and a randomly generated root password.

## One-time setup (run these on your actual VPS, not in Codespaces)

1. Make sure Docker is installed on your VPS:
   ```bash
   docker --version
   ```
   If that fails, install Docker first (e.g. `curl -fsSL https://get.docker.com | sh` on most distros).

2. Build the image (run this from the project root, i.e. one level up from this `docker/` folder):
   ```bash
   docker build -t coin-bot-vps ./docker
   ```
   This must match `DOCKER.IMAGE` in `config.js` (default: `coin-bot-vps`).

3. Open the port range in your firewall so people can actually SSH in:
   ```bash
   sudo ufw allow 20000:20100/tcp
   ```
   (Adjust to match `DOCKER.PORT_RANGE` in `config.js` if you change it.)

4. Set `DOCKER.SSH_HOST` in `config.js` to your VPS's real public IP or domain name —
   this is what gets shown to users so they know where to `ssh` to.

5. Make sure the bot process itself has permission to run `docker` commands
   (either run the bot as root, or add its user to the `docker` group:
   `sudo usermod -aG docker $USER` then log back in).

## Security notes (read before turning this on for real users)

- Every container gets **root** access inside itself. That's real root *inside the
  container*, not on your host — but a container escape, while uncommon, is not
  impossible. Don't run this on a box with anything sensitive on it.
- The per-container memory/CPU caps (`DOCKER.MEMORY` / `DOCKER.CPUS` in config.js)
  stop one user from starving the others, but your host is still the shared ceiling —
  100 containers × 512m each needs 50GB of RAM to actually honor those limits.
- Consider adding a cap on total containers, and/or auto-expiring/deleting containers
  after N days, so this doesn't grow forever. Ask if you want that added.
- Passwords are stored in plaintext in `data.json` so `!myvps` can re-show them —
  keep that file private (it's already meant to stay off any public repo).
