import { Camera } from "three";
import { MathUtils } from "three";
import { Matrix4 } from "three";

class CalibratedCamera extends Camera {
  constructor(
    fx = 35,
    fy = 35,
    cx = 0,
    cy = 0,
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
    this.cx = cx;
    this.cy = cy;
    this.skew_c = skew_c;
    this.width = width;
    this.height = height;
    this.near = near;
    this.far = far;

    this.aspect = this.width / this.height;
    console.log(this.aspect);
    this.filmGauge = 35;

    // 520 * 35 /
    this.Fx = (fx * this.filmGauge) / this.width;
    this.Fy = (fy * this.filmGauge) / Math.max(this.aspect, 1) / this.height;

    // const vExtentSlope =
    //   (0.5 * this.filmGauge) / Math.max(this.aspect, 1) / this.Fx;
    const vExtentSlope = (0.5 * this.height) / this.fx;

    this.fov = MathUtils.RAD2DEG * 2 * Math.atan(vExtentSlope);
    console.log(this.fov);
    this.screenToCameraMatrix = new Matrix4();

    this.updateProjectionMatrix();
  }

  updateProjectionMatrix() {
    // assume that zoom is 1
    const near = this.near;
    const near_height =
      2 * this.near * Math.tan(MathUtils.DEG2RAD * 0.5 * this.fov);
    const near_width = this.aspect * near_height;

    let near_left = -0.5 * near_width + (this.cx / this.width) * near_width;
    let near_right = 0.5 * near_width + (this.cx / this.width) * near_width;
    let near_top = 0.5 * near_height + (this.cy / this.height) * near_height;
    let near_bottom =
      -0.5 * near_height + (this.cy / this.height) * near_height;
    // let near_left = -0.5 * near_width;
    // let near_right = 0.5 * near_width;
    // let near_top = 0.5 * near_height;
    // let near_bottom = -0.5 * near_height;

    this.projectionMatrix.makePerspective(
      near_left,
      near_right,
      near_top,
      near_bottom,
      this.near,
      this.far
    );

    let X = this.near + this.far;
    let Y = this.near * this.far;
    let intrinsicCameraMatrix = new Matrix4();
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
    // this.projectionMatrix.multiply(intrinsicCameraMatrix);

    this.screenToCameraMatrix.set(
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
      -1, //-1
      0,
      0,
      0,
      0,
      1
    );
    this.screenToCameraMatrix.invert();
    // this.projectionMatrix.copy(this.screenToCameraMatrix);
    // this.projectionMatrixInverse.copy(
    //   this.screenToCameraMatrix.clone().invert()
    // );

    // this.projectionMatrix.copy(intrinsicCameraMatrix);
    // this.projectionMatrixInverse.copy(intrinsicCameraMatrix.clone().invert());

    this.projectionMatrixInverse.copy(this.projectionMatrix).invert();
  }

  toJSON(meta) {
    const data = super.toJSON(meta);

    // data.object.fov = this.fov;
    // data.object.zoom = this.zoom;

    data.object.near = this.near;
    data.object.far = this.far;
    // data.object.focus = this.focus;

    data.object.aspect = this.aspect;

    // if (this.view !== null) data.object.view = Object.assign({}, this.view);

    // data.object.filmGauge = this.filmGauge;
    // data.object.filmOffset = this.filmOffset;

    return data;
  }
}

export { CalibratedCamera };
