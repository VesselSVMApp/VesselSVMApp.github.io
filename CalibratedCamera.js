import { Camera } from "three";
import { MathUtils } from "three";
import { Matrix4 } from "three";

class CalibratedCamera extends Camera {
  constructor(
    fx = 3500,
    fy = 3500,
    cx = 1000,
    cy = 1000,
    skew_c = 0,
    width = 640,
    height = 360,
    near = 0.1,
    far = 2000
  ) {
    super();

    this.isCalibratedCamera = true;

    // fx, fy, cx, cy, s, width, height, near, far
    this.type = "CalibratedCamera";

    this.fx = fx;
    this.fy = fy;
    // this.cx = cx;
    // this.cy = cy;
    this.skew_c = skew_c;
    this.width = width;
    this.height = height;
    this.near = near;
    this.far = far;

    this.cx = this.width / 2 - cx;
    this.cy = this.height / 2 - cy;

    this.updateProjectionMatrix();
  }

  updateProjectionMatrix() {
    this.projectionMatrix.makeOrthographic(
      -this.width / 2.0,
      this.width / 2.0,
      this.height / 2.0,
      -this.height / 2.0,
      this.near,
      this.far
    );

    var X = this.near + this.far;
    var Y = this.near * this.far;
    var intrinsicCameraMatrix = new Matrix4();
    intrinsicCameraMatrix.set(
      this.fx,
      this.skew_c,
      -this.cx,
      0,
      0,
      this.fy,
      -this.cy,
      0,
      0,
      0,
      X,
      Y,
      0,
      0,
      -1,
      0
    );
    this.projectionMatrix.multiply(intrinsicCameraMatrix);
    this.projectionMatrixInverse.copy(this.projectionMatrix).invert();
  }

  toJSON(meta) {
    const data = super.toJSON(meta);
    data.object.near = this.near;
    data.object.far = this.far;
    return data;
  }
}

export { CalibratedCamera };
