
function multiplyQuaternion(a, b) {
	return {
	w: a.w * b.w - a.x * b.x - a.y * b.y - a.z * b.z,
	x: a.w * b.x + a.x * b.w + a.y * b.z - a.z * b.y,
	y: a.w * b.y + a.y * b.w + a.z * b.x - a.x * b.z,
	z: a.w * b.z + a.z * b.w + a.x * b.y - a.y * b.x,
	};
}

function conjugateQuaternion(q) {
	return {w:q.w, x:-q.x, y:-q.y, z:-q.z};
}

function normalizeQuaternion(q) {
	var r = Math.sqrt(q.w * q.w + q.x * q.x + q.y * q.y + q.z * q.z);
	return {w: q.w / r, x: q.x / r, y: q.y / r, z: q.z / r};
}

function makeIdentityMatrix(x, y, z) {
	return [1, 0, 0, 0,
			0, 1, 0, 0,
			0, 0, 1, 0,
			0, 0, 0, 1];
}

function makeOrthoMatrix(left, right, bottom, top, near, far) {
	return [1 / (right - left), 0, 0, 0,
			0, 1 / (top - bottom), 0, 0,
			0, 0, 1 / (far - near), 0,
			-left / (right - left), -bottom / (top - bottom), -near / (far - near), 1];
}

function translateMatrix(m, x, y, z) {
	return concatMatrix(makeTranslationMatrix(x, y, z), m);
}

function makeTranslationMatrix(x, y, z) {
	return [1, 0, 0, 0,
			0, 1, 0, 0,
			0, 0, 1, 0,
			x, y, z, 1];
}

function scaleMatrix(m, x, y, z) {
	return concatMatrix(makeScaleMatrix(x, y, z), m);
}

function makeScaleMatrix(x, y, z) {
	return [x, 0, 0, 0,
			0, y, 0, 0,
			0, 0, z, 0,
			0, 0, 0, 1];
}

function rotateMatrix(m, angle, x, y, z) {
	return concatMatrix(makeRotationMatrix(angle, x, y, z), m);
}

function makeRotationMatrix(angle, x, y, z) {
	var w = Math.cos(angle / 2);
	var v = Math.sin(angle / 2) / Math.sqrt(x * x + y * y + z * z);
	return makeRotationMatrixWithQuaternion(w, v * x, v * y, v * z);
}

function rotateMatrixWithQuaternion(m, w, x, y, z) {
	return concatMatrix(makeRotationMatrixWithQuaternion(w, x, y, z), m);
}

function makeRotationMatrixWithQuaternion(w, x, y, z) {
	return [w * w + x * x - y * y - z * z, 2 * (y * x - w * z), 2 * (z * x + w * y), 0,
			2 * (x * y + w * z), w * w - x * x + y * y - z * z, 2 * (z * y - w * x), 0,
			2 * (x * z - w * y) ,2 * (y * z + w * x), w * w - x * x - y * y + z * z, 0,
			0, 0, 0, 1];
}

function concatFrustumMatrix(m, left, right, bottom, top, near, far) {
	return concatMatrix(makeFrustumMatrix(left, right, bottom, top, near, far), m);
}

function makeFrustumMatrix(left, right, bottom, top, near, far) {
	return [2 * near / (right - left), 0, 0, 0,
			0, 2 * near / (top - bottom), 0, 0,
			(right + left) / (right - left), (top + bottom) / (top - bottom), - (far + near) / (far - near), -1,
			0, 0, -2 * far * near / (far - near), 0];
}

function concatPerspectiveMatrix(m, fovy, aspect, zNear, zFar) {
	return concatMatrix(makePerspectiveMatrix(fovy, aspect, zNear, zFar), m);
}

function makePerspectiveMatrix(fovy, aspect, zNear, zFar) {
	var f = 1 / Math.tan(fovy / 2);
	return [f / aspect, 0, 0, 0,
			0, f, 0, 0,
			0, 0, (zFar + zNear) / (zNear - zFar), -1,
			0, 0, (2 * zFar * zNear) / (zNear - zFar), 0];
}

function concatLookAtMatrix(m, eyeX, eyeY, eyeZ, centerX, centerY, centerZ, upX, upY, upZ) {
	return concatMatrix(makeLookAtMatrix(eyeX, eyeY, eyeZ, centerX, centerY, centerZ, upX, upY, upZ), m);
}

function makeLookAtMatrix(eyeX, eyeY, eyeZ, centerX, centerY, centerZ, upX, upY, upZ) {
	var fx = centerX - eyeX;
	var fy = centerY - eyeY;
	var fz = centerZ - eyeZ;
	var sx = fy * upZ - fz * upY;
	var sy = fz * upX - fx * upZ;
	var sz = fx * upY - fy * upX;
	var ux = sy * fz - sz * fy;
	var uy = sz * fx - sx * fz;
	var uz = sx * fy - sy * fx;
	var f = Math.sqrt(fx * fx + fy * fy + fz * fz);
	var s = Math.sqrt(sx * sx + sy * sy + sz * sz);
	var u = Math.sqrt(ux * ux + uy * uy + uz * uz);
	return translateMatrix([sx / s, ux / u, -fx / f, 0,
							sy / s, uy / u, -fy / f, 0,
							sz / s, uz / u, -fz / f, 0,
							0, 0, 0, 1], -eyeX, -eyeY, -eyeZ);
}

function concatMatrix(a, b) {
	return [a[2] * b[8] + a[1] * b[4] + a[3] * b[12] + a[0] * b[0],
			a[2] * b[9] + a[1] * b[5] + a[3] * b[13] + a[0] * b[1],
			a[1] * b[6] + a[0] * b[2] + a[3] * b[14] + a[2] * b[10],
			a[1] * b[7] + a[0] * b[3] + a[3] * b[15] + a[2] * b[11],
			a[6] * b[8] + a[5] * b[4] + a[7] * b[12] + a[4] * b[0],
			a[6] * b[9] + a[5] * b[5] + a[7] * b[13] + a[4] * b[1],
			a[5] * b[6] + a[4] * b[2] + a[7] * b[14] + a[6] * b[10],
			a[5] * b[7] + a[4] * b[3] + a[7] * b[15] + a[6] * b[11],
			a[10] * b[8] + a[9] * b[4] + a[11] * b[12] + a[8] * b[0],
			a[10] * b[9] + a[9] * b[5] + a[11] * b[13] + a[8] * b[1],
			a[9] * b[6] + a[8] * b[2] + a[11] * b[14] + a[10] * b[10],
			a[9] * b[7] + a[8] * b[3] + a[11] * b[15] + a[10] * b[11],
			a[14] * b[8] + a[13] * b[4] + a[15] * b[12] + a[12] * b[0],
			a[14] * b[9] + a[13] * b[5] + a[15] * b[13] + a[12] * b[1],
			a[13] * b[6] + a[12] * b[2] + a[15] * b[14] + a[14] * b[10],
			a[13] * b[7] + a[12] * b[3] + a[15] * b[15] + a[14] * b[11]];
}

function invertMatrix(m) {
	var determinant =
	m[0]*(-m[6]*(m[15]*m[9]-m[11]*m[13])+m[7]*(m[14]*m[9]-m[10]*m[13])+(m[10]*m[15]-m[11]*m[14])*m[5])+
	m[2]*(m[4]*(m[15]*m[9]-m[11]*m[13])+m[7]*(m[13]*m[8]-m[12]*m[9])-m[5]*(m[15]*m[8]-m[11]*m[12]))-
	m[3]*(m[4]*(m[14]*m[9]-m[10]*m[13])+m[6]*(m[13]*m[8]-m[12]*m[9])-m[5]*(m[14]*m[8]-m[10]*m[12]))-
	m[1]*(-m[6]*(m[15]*m[8]-m[11]*m[12])+m[7]*(m[14]*m[8]-m[10]*m[12])+(m[10]*m[15]-m[11]*m[14])*m[4]);
	var inverse = [m[14]*m[7]*m[9]-m[15]*m[6]*m[9]-m[10]*m[13]*m[7]+m[11]*m[13]*m[6]+m[10]*m[15]*m[5]-m[11]*m[14]*m[5],
				   -(m[14]*m[3]*m[9]-m[15]*m[2]*m[9]-m[10]*m[13]*m[3]+m[11]*m[13]*m[2]+m[1]*m[10]*m[15]-m[1]*m[11]*m[14]),
				   m[13]*m[2]*m[7]-m[1]*m[14]*m[7]-m[13]*m[3]*m[6]+m[1]*m[15]*m[6]+m[14]*m[3]*m[5]-m[15]*m[2]*m[5],
				   -(m[2]*m[7]*m[9]-m[3]*m[6]*m[9]-m[1]*m[10]*m[7]+m[1]*m[11]*m[6]+m[10]*m[3]*m[5]-m[11]*m[2]*m[5]),
				   -(m[14]*m[7]*m[8]-m[15]*m[6]*m[8]-m[10]*m[12]*m[7]+m[11]*m[12]*m[6]+m[10]*m[15]*m[4]-m[11]*m[14]*m[4]),
				   m[14]*m[3]*m[8]-m[15]*m[2]*m[8]-m[10]*m[12]*m[3]+m[11]*m[12]*m[2]+m[0]*m[10]*m[15]-m[0]*m[11]*m[14],
				   -(m[12]*m[2]*m[7]-m[0]*m[14]*m[7]-m[12]*m[3]*m[6]+m[0]*m[15]*m[6]+m[14]*m[3]*m[4]-m[15]*m[2]*m[4]),
				   m[2]*m[7]*m[8]-m[3]*m[6]*m[8]-m[0]*m[10]*m[7]+m[0]*m[11]*m[6]+m[10]*m[3]*m[4]-m[11]*m[2]*m[4],
				   -(m[12]*m[7]*m[9]-m[15]*m[4]*m[9]-m[13]*m[7]*m[8]+m[15]*m[5]*m[8]-m[11]*m[12]*m[5]+m[11]*m[13]*m[4]),
				   m[12]*m[3]*m[9]-m[0]*m[15]*m[9]-m[13]*m[3]*m[8]+m[1]*m[15]*m[8]+m[0]*m[11]*m[13]-m[1]*m[11]*m[12],
				   -(m[0]*m[13]*m[7]-m[1]*m[12]*m[7]+m[12]*m[3]*m[5]-m[0]*m[15]*m[5]-m[13]*m[3]*m[4]+m[1]*m[15]*m[4]),
				   m[0]*m[7]*m[9]-m[3]*m[4]*m[9]-m[1]*m[7]*m[8]+m[3]*m[5]*m[8]-m[0]*m[11]*m[5]+m[1]*m[11]*m[4],
				   m[12]*m[6]*m[9]-m[14]*m[4]*m[9]-m[13]*m[6]*m[8]+m[14]*m[5]*m[8]-m[10]*m[12]*m[5]+m[10]*m[13]*m[4],
				   -(m[12]*m[2]*m[9]-m[0]*m[14]*m[9]-m[13]*m[2]*m[8]+m[1]*m[14]*m[8]+m[0]*m[10]*m[13]-m[1]*m[10]*m[12]),
				   m[0]*m[13]*m[6]-m[1]*m[12]*m[6]+m[12]*m[2]*m[5]-m[0]*m[14]*m[5]-m[13]*m[2]*m[4]+m[1]*m[14]*m[4],
				   -(m[0]*m[6]*m[9]-m[2]*m[4]*m[9]-m[1]*m[6]*m[8]+m[2]*m[5]*m[8]-m[0]*m[10]*m[5]+m[1]*m[10]*m[4])];
	for (var i in inverse) {
		inverse[i] /= determinant;
	}
	return inverse;
}

function applyInverseMatrix(m, v) {
	var u = {
	x: (m.yy * m.zz - m.yz * m.yz) * v.x + (m.yz * m.zx - m.xy * m.zz) * v.y + (m.xy * m.yz - m.yy * m.zx) * v.z,
	y: (m.yz * m.zx - m.xy * m.zz) * v.x + (m.xx * m.zz - m.zx * m.zx) * v.y + (m.xy * m.zx - m.xx * m.yz) * v.z,
	z: (m.xy * m.yz - m.yy * m.zx) * v.x + (m.xy * m.zx - m.xx * m.yz) * v.y + (m.xx * m.yy - m.xy * m.xy) * v.z,
	};
	var det = 2 * m.xy * m.yz * m.zx + m.xx * m.yy * m.zz - m.xx * m.yz * m.yz - m.yy * m.zx * m.zx - m.zz * m.xy * m.xy;
	if (det > 0) {
		u.x /= det;
		u.y /= det;
		u.z /= det;
	}
	return u;
}
