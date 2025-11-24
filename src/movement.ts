import L from "leaflet";

export type Mode = "buttons" | "geolocation";

export interface MovementOptions {
  getPosition: () => L.LatLng;
  onPosition: (pos: L.LatLng) => void;
  speed?: number;
  upBtn?: HTMLElement | null;
  downBtn?: HTMLElement | null;
  leftBtn?: HTMLElement | null;
  rightBtn?: HTMLElement | null;
}

class ButtonMovement {
  private opts: MovementOptions;
  private keyHandler = (e: KeyboardEvent) => this.onKey(e);
  private upClick?: EventListener;
  private downClick?: EventListener;
  private leftClick?: EventListener;
  private rightClick?: EventListener;

  constructor(opts: MovementOptions) {
    this.opts = opts;
  }

  start() {
    globalThis.addEventListener("keydown", this.keyHandler);
    const { upBtn, downBtn, leftBtn, rightBtn } = this.opts;
    if (upBtn) {
      this.upClick = () => this.step("up");
      upBtn.addEventListener("click", this.upClick);
    }
    if (downBtn) {
      this.downClick = () => this.step("down");
      downBtn.addEventListener("click", this.downClick);
    }
    if (leftBtn) {
      this.leftClick = () => this.step("left");
      leftBtn.addEventListener("click", this.leftClick);
    }
    if (rightBtn) {
      this.rightClick = () => this.step("right");
      rightBtn.addEventListener("click", this.rightClick);
    }
  }

  stop() {
    globalThis.removeEventListener("keydown", this.keyHandler);
    const { upBtn, downBtn, leftBtn, rightBtn } = this.opts;
    if (upBtn && this.upClick) upBtn.removeEventListener("click", this.upClick);
    if (downBtn && this.downClick) {
      downBtn.removeEventListener("click", this.downClick);
    }
    if (leftBtn && this.leftClick) {
      leftBtn.removeEventListener("click", this.leftClick);
    }
    if (rightBtn && this.rightClick) {
      rightBtn.removeEventListener("click", this.rightClick);
    }
  }

  private onKey(e: KeyboardEvent) {
    const k = e.key.toLowerCase();
    if (k === "w" || k === "arrowup") {
      e.preventDefault();
      this.step("up");
    } else if (k === "s" || k === "arrowdown") {
      e.preventDefault();
      this.step("down");
    } else if (k === "a" || k === "arrowleft") {
      e.preventDefault();
      this.step("left");
    } else if (k === "d" || k === "arrowright") {
      e.preventDefault();
      this.step("right");
    }
  }

  private step(dir: "up" | "down" | "left" | "right") {
    const speed = this.opts.speed ?? 0.0001;
    const cur = this.opts.getPosition();
    let next: L.LatLng;
    switch (dir) {
      case "up":
        next = L.latLng(cur.lat + speed, cur.lng);
        break;
      case "down":
        next = L.latLng(cur.lat - speed, cur.lng);
        break;
      case "left":
        next = L.latLng(cur.lat, cur.lng - speed);
        break;
      case "right":
        next = L.latLng(cur.lat, cur.lng + speed);
        break;
    }
    this.opts.onPosition(next);
  }
}

class GeolocationMovement {
  private opts: MovementOptions;
  private watchId: number | null = null;
  private onError = (err: GeolocationPositionError | unknown) => {
    console.warn("Geolocation error:", err);
  };

  constructor(opts: MovementOptions) {
    this.opts = opts;
  }

  start() {
    if (!navigator.geolocation) {
      console.warn("Geolocation not available");
      return;
    }
    console.log("GeolocationMovement: requesting position...");
    this.watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const accuracy = pos.coords.accuracy;
        const currentGeo = L.latLng(lat, lng);

        console.log(
          `GeolocationMovement: position received - lat: ${lat}, lng: ${lng}, accuracy: ${accuracy}m`,
        );

        this.opts.onPosition(currentGeo);
      },
      (err) => {
        console.warn("Geolocation error:", err.code, err.message);
        this.onError(err);
      },
      { enableHighAccuracy: true, maximumAge: 1000, timeout: 5000 },
    );
  }

  stop() {
    if (this.watchId !== null) navigator.geolocation.clearWatch(this.watchId);
    this.watchId = null;
  }
}

export class MovementFacade {
  private mode: Mode = "buttons";
  private opts: MovementOptions;
  private buttonMovement: ButtonMovement;
  private geoMovement: GeolocationMovement;
  private activeController: ButtonMovement | GeolocationMovement | null = null;

  constructor(opts: MovementOptions, initialMode: Mode = "buttons") {
    this.opts = opts;
    this.buttonMovement = new ButtonMovement(opts);
    this.geoMovement = new GeolocationMovement(opts);
    this.mode = initialMode;
  }

  start() {
    this.stop();
    if (this.mode === "buttons") {
      this.buttonMovement.start();
      this.activeController = this.buttonMovement;
    } else {
      this.geoMovement.start();
      this.activeController = this.geoMovement;
    }
  }

  stop() {
    this.buttonMovement.stop();
    this.geoMovement.stop();
    this.activeController = null;
  }

  setMode(m: Mode) {
    if (m === this.mode) return;
    this.mode = m;
    this.start();
  }

  getMode(): Mode {
    return this.mode;
  }
}

export default MovementFacade;
