#!/usr/bin/env python3
"""
Succubus.red System Tray and Server Control Application.

Provides intuitive server monitoring and lifecycle control:
- Start / Stop / Restart Node.js Express Backend (port 3001)
- Start / Stop / Restart Vite Frontend (port 5173)
- Health check and port monitoring
- Launch web dashboard in browser
- Tail server/client logs
- Graceful shutdown of all servers

Supports both interactive GUI tray mode (using pystray or tkinter if desktop display is available)
and CLI/Daemon control mode for headless and automation environments.
"""

import os
import sys
import time
import signal
import socket
import subprocess
import argparse
import webbrowser
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent
SERVER_DIR = ROOT_DIR / "server"
CLIENT_DIR = ROOT_DIR / "client"
SERVER_LOG = ROOT_DIR / "server.log"
CLIENT_LOG = ROOT_DIR / "client.log"

def is_port_open(port: int) -> bool:
    """Check if a network port is listening on IPv4 or IPv6."""
    # Check IPv4
    try:
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            s.settimeout(0.5)
            if s.connect_ex(("127.0.0.1", port)) == 0:
                return True
    except Exception:
        pass

    # Check IPv6 (Vite default on some systems)
    try:
        with socket.socket(socket.AF_INET6, socket.SOCK_STREAM) as s:
            s.settimeout(0.5)
            if s.connect_ex(("::1", port)) == 0:
                return True
    except Exception:
        pass

    return len(get_pids_on_port(port)) > 0

def get_pids_on_port(port: int):
    """Find process IDs listening on a specific port."""
    try:
        out = subprocess.check_output(["lsof", "-t", f"-i:{port}"], stderr=subprocess.DEVNULL)
        pids = [int(p.strip()) for p in out.decode().split() if p.strip()]
        return pids
    except Exception:
        return []

def kill_port(port: int):
    """Kill processes occupying a port."""
    pids = get_pids_on_port(port)
    for pid in pids:
        try:
            os.kill(pid, signal.SIGTERM)
            time.sleep(0.2)
        except ProcessLookupError:
            pass
        except Exception as e:
            print(f"Warning: could not kill PID {pid}: {e}")

class ServerManager:
    """Manages backend and frontend server processes."""

    def __init__(self):
        self.server_port = 3001
        self.client_port = 5173

    def status(self):
        backend_active = is_port_open(self.server_port)
        frontend_active = is_port_open(self.client_port)
        return {
            "backend": {
                "active": backend_active,
                "port": self.server_port,
                "pids": get_pids_on_port(self.server_port)
            },
            "frontend": {
                "active": frontend_active,
                "port": self.client_port,
                "pids": get_pids_on_port(self.client_port)
            }
        }

    def print_status(self):
        st = self.status()
        b_icon = "🟢 RUNNING" if st["backend"]["active"] else "🔴 STOPPED"
        f_icon = "🟢 RUNNING" if st["frontend"]["active"] else "🔴 STOPPED"
        print("=" * 45)
        print("  Succubus.red Server Control Status")
        print("=" * 45)
        print(f"  Backend (Express) : {b_icon} on port {st['backend']['port']} (PIDs: {st['backend']['pids']})")
        print(f"  Frontend (Vite)   : {f_icon} on port {st['frontend']['port']} (PIDs: {st['frontend']['pids']})")
        print("=" * 45)

    def start_backend(self):
        if is_port_open(self.server_port):
            print(f"[Backend] Already running on port {self.server_port}.")
            return
        print("[Backend] Starting Express server...")
        with open(SERVER_LOG, "a") as f:
            subprocess.Popen(
                ["npm", "start"],
                cwd=str(SERVER_DIR),
                stdout=f,
                stderr=subprocess.STDOUT,
                start_new_session=True
            )
        for _ in range(20):
            if is_port_open(self.server_port):
                print(f"[Backend] Successfully started on port {self.server_port}.")
                return
            time.sleep(0.2)
        print("[Backend] Warning: Server start initiated, check server.log if connection fails.")

    def start_frontend(self):
        if is_port_open(self.client_port):
            print(f"[Frontend] Already running on port {self.client_port}.")
            return
        print("[Frontend] Starting Vite dev server...")
        with open(CLIENT_LOG, "a") as f:
            subprocess.Popen(
                ["npm", "run", "dev"],
                cwd=str(CLIENT_DIR),
                stdout=f,
                stderr=subprocess.STDOUT,
                start_new_session=True
            )
        for _ in range(20):
            if is_port_open(self.client_port):
                print(f"[Frontend] Successfully started on port {self.client_port}.")
                return
            time.sleep(0.2)
        print("[Frontend] Warning: Vite start initiated, check client.log if connection fails.")

    def start_all(self):
        self.start_backend()
        self.start_frontend()

    def stop_all(self):
        print("Stopping all Succubus.red servers...")
        kill_port(self.server_port)
        kill_port(self.client_port)
        time.sleep(0.5)
        print("All servers stopped.")

    def restart_all(self):
        print("Restarting all Succubus.red servers...")
        self.stop_all()
        time.sleep(1)
        self.start_all()

    def open_browser(self):
        url = f"http://localhost:{self.client_port}"
        print(f"Opening browser at {url}...")
        try:
            webbrowser.open(url)
        except Exception as e:
            print(f"Could not open browser: {e}")

    def check_health(self):
        """Perform comprehensive HTTP health checks against frontend and backend."""
        import urllib.request
        import json

        print("=============================================")
        print("  Succubus.red Health Diagnostic Check")
        print("=============================================")

        backend_url = f"http://localhost:{self.server_port}/api/health"
        frontend_url = f"http://localhost:{self.client_port}"

        try:
            req = urllib.request.Request(backend_url)
            with urllib.request.urlopen(req, timeout=3) as resp:
                data = json.loads(resp.read().decode('utf-8'))
                status_icon = "🟢" if data.get('status') == 'healthy' else "🟡"
                print(f"  Backend API    : {status_icon} {data.get('status').upper()} (DB: {data.get('database')}, Uptime: {data.get('uptime')}s)")
        except Exception as e:
            print(f"  Backend API    : 🔴 UNREACHABLE ({e})")

        try:
            req = urllib.request.Request(frontend_url)
            with urllib.request.urlopen(req, timeout=3) as resp:
                print(f"  Frontend Vite  : 🟢 REACHABLE (HTTP {resp.status})")
        except Exception as e:
            print(f"  Frontend Vite  : 🔴 UNREACHABLE ({e})")

        print("=============================================")

    def tail_logs(self, lines=20):
        print("--- SERVER LOG (last 20 lines) ---")
        if SERVER_LOG.exists():
            content = SERVER_LOG.read_text().splitlines()
            for line in content[-lines:]:
                print(line)
        else:
            print("No server.log found.")

        print("\n--- CLIENT LOG (last 20 lines) ---")
        if CLIENT_LOG.exists():
            content = CLIENT_LOG.read_text().splitlines()
            for line in content[-lines:]:
                print(line)
        else:
            print("No client.log found.")

def run_tray_gui(manager: ServerManager):
    """Run interactive graphical system tray if pystray is installed and DISPLAY exists."""
    try:
        import pystray
        from PIL import Image, ImageDraw

        def create_image(status_ok):
            image = Image.new('RGB', (64, 64), color=(30, 30, 30))
            d = ImageDraw.Draw(image)
            color = (0, 255, 128) if status_ok else (255, 64, 129)
            d.ellipse([16, 16, 48, 48], fill=color)
            return image

        def on_open_web(icon, item):
            manager.open_browser()

        def on_restart(icon, item):
            manager.restart_all()
            icon.icon = create_image(is_port_open(manager.server_port) and is_port_open(manager.client_port))

        def on_quit(icon, item):
            print("Quit requested via System Tray. Stopping servers...")
            manager.stop_all()
            icon.stop()

        status_ok = is_port_open(manager.server_port) and is_port_open(manager.client_port)
        menu = pystray.Menu(
            pystray.MenuItem("Succubus.red 3D Companion", lambda: None, enabled=False),
            pystray.MenuItem("Open Web Dashboard", on_open_web),
            pystray.MenuItem("Restart Servers", on_restart),
            pystray.Menu.SEPARATOR,
            pystray.MenuItem("Quit All & Exit", on_quit)
        )

        icon = pystray.Icon("SuccubusRedTray", create_image(status_ok), "Succubus.red Controller", menu)
        print("System Tray icon launched successfully.")
        icon.run()
    except ImportError:
        print("pystray or PIL not installed. Running in CLI / Daemon mode.")
        run_interactive_cli(manager)
    except Exception as e:
        print(f"System Tray GUI unavailable ({e}). Running in CLI / Daemon mode.")
        run_interactive_cli(manager)

def run_interactive_cli(manager: ServerManager):
    """Fallback interactive CLI menu."""
    manager.print_status()
    print("\nAvailable Commands:")
    print("  [s] Check Status    [u] Start All      [d] Stop All (Quit)")
    print("  [r] Restart All     [o] Open Browser   [l] Tail Logs")
    print("  [q] Quit System Tray Manager (Leaves servers running or prompts)\n")


def main():
    parser = argparse.ArgumentParser(description="Succubus.red System Tray & Server Control")
    parser.add_argument("command", nargs="?", default="status",
                        choices=["status", "start", "stop", "restart", "tray", "logs", "open", "health"],
                        help="Command to execute")
    args = parser.parse_args()

    manager = ServerManager()

    if args.command == "status":
        manager.print_status()
    elif args.command == "start":
        manager.start_all()
        manager.print_status()
    elif args.command == "stop":
        manager.stop_all()
        manager.print_status()
    elif args.command == "restart":
        manager.restart_all()
        manager.print_status()
    elif args.command == "logs":
        manager.tail_logs()
    elif args.command == "open":
        manager.open_browser()
    elif args.command == "health":
        manager.check_health()
    elif args.command == "tray":
        run_tray_gui(manager)

if __name__ == "__main__":
    main()
