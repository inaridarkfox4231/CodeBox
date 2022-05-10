/*
 * WebGL Water
 * https://madebyevan.com/webgl-water/
 *
 * Copyright 2011 Evan Wallace
 * Released under the MIT license
 */

function Cubemap() {
  this.id = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_CUBE_MAP, this.id);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
  gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

  // ここでimage作ってonloadで登録してsrc設定してっていうのを6回やるとか。？
  let imgXneg = new Image();
  imgXneg.onload = () => {
      gl.texImage2D(gl.TEXTURE_CUBE_MAP_NEGATIVE_X, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, imgXneg);
  };
  imgXneg.src = "https://inaridarkfox4231.github.io/assets/webglWaterImgs/xneg.jpg";
  let imgXpos = new Image();
  imgXpos.onload = () => {
      gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_X, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, imgXpos);
  };
  imgXpos.src = "https://inaridarkfox4231.github.io/assets/webglWaterImgs/xpos.jpg";
  let imgYneg = new Image();
  imgYneg.onload = () => {
      gl.texImage2D(gl.TEXTURE_CUBE_MAP_NEGATIVE_X, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, imgYneg);
  };
  imgYneg.src = "https://inaridarkfox4231.github.io/assets/webglWaterImgs/ypos.jpg";
  let imgYpos = new Image();
  imgYpos.onload = () => {
      gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_Y, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, imgYpos);
  };
  imgYpos.src = "https://inaridarkfox4231.github.io/assets/webglWaterImgs/ypos.jpg";
  let imgZneg = new Image();
  imgZneg.onload = () => {
      gl.texImage2D(gl.TEXTURE_CUBE_MAP_NEGATIVE_Z, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, imgZneg);
  };
  imgZneg.src = "https://inaridarkfox4231.github.io/assets/webglWaterImgs/zneg.jpg";
  let imgZpos = new Image();
  imgZpos.onload = () => {
      gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_Z, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, imgZpos);
  };
  imgZpos.src = "https://inaridarkfox4231.github.io/assets/webglWaterImgs/zpos.jpg";
  /*
  gl.texImage2D(gl.TEXTURE_CUBE_MAP_NEGATIVE_X, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, images.xneg);
  gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_X, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, images.xpos);
  gl.texImage2D(gl.TEXTURE_CUBE_MAP_NEGATIVE_Y, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, images.yneg);
  gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_Y, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, images.ypos);
  gl.texImage2D(gl.TEXTURE_CUBE_MAP_NEGATIVE_Z, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, images.zneg);
  gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_Z, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, images.zpos);
  */
}

Cubemap.prototype.bind = function(unit) {
    gl.activeTexture(gl.TEXTURE0 + (unit || 0));
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, this.id);
};

Cubemap.prototype.unbind = function(unit) {
    gl.activeTexture(gl.TEXTURE0 + (unit || 0));
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, null);
};
