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

    this.cx = cx - this.width / 2;
    this.cy = cy - this.height / 2;

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
  copy(source, recursive) {
    super.copy(source, recursive);
    this.matrixWorldInverse.copy(source.matrixWorldInverse);
    this.projectionMatrix.copy(source.projectionMatrix);
    this.projectionMatrixInverse.copy(source.projectionMatrixInverse);

    this.fx.copy(source.fx);
    this.fy.copy(source.fy);
    this.cx.copy(source.cx);
    this.cy.copy(source.cy);
    this.skew_c.copy(source.skew_c);
    this.width.copy(source.width);
    this.height.copy(source.height);
    this.near.copy(source.near);
    this.far.copy(source.far);

    return this;
  }
  copy(source, recursive) {
    super.copy(source, recursive);

    return this;
  }
  clone() {
    return new this.constructor().copy(this);
  }

  toJSON(meta) {
    const data = super.toJSON(meta);
    data.object.fx = this.fx;
    data.object.fy = this.fy;
    data.object.skew_c = this.skew_c;
    data.object.width = this.width;
    data.object.height = this.height;
    data.object.near = this.near;
    data.object.far = this.far;
    data.object.cx = this.cx;
    data.object.cy = this.cy;
    // data.object.cx=this.cx = cx - this.width / 2;
    // data.object.cy=this.cy = cy - this.height / 2;
    return data;
  }
}

export { CalibratedCamera };
