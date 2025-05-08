// === MATRIX ===
function GetModelViewMatrix(translationX, translationY, translationZ, rotationX, rotationY) {
	const cosX = Math.cos(rotationX), sinX = Math.sin(rotationX);
	const cosY = Math.cos(rotationY), sinY = Math.sin(rotationY);

	const rotX = [
		1, 0, 0, 0,
		0, cosX, sinX, 0,
		0, -sinX, cosX, 0,
		0, 0, 0, 1
	];

	const rotY = [
		cosY, 0, -sinY, 0,
		0, 1, 0, 0,
		sinY, 0, cosY, 0,
		0, 0, 0, 1
	];

	const trans = [
		1, 0, 0, 0,
		0, 1, 0, 0,
		0, 0, 1, 0,
		translationX, translationY, translationZ, 1
	];

	return MatrixMult(trans, MatrixMult(rotY, rotX));
}

// === SHADERS ===
const meshVS = `attribute vec3 position;
attribute vec3 normal;
attribute vec2 texCoord;

uniform mat4 mvp;
uniform mat4 mv;
uniform mat3 normalMatrix;
uniform mat4 yzSwap;

varying vec3 vNormal;
varying vec3 vPos;
varying vec2 vTexCoord;

void main() {
    vNormal = normalMatrix * normal;
    vPos = vec3(mv * vec4(position, 1.0));
    vTexCoord = texCoord;
    gl_Position = mvp * yzSwap * vec4(position, 1.0);
}`;

const meshFS = `
precision mediump float;

uniform sampler2D tex;
uniform int useTexture;
uniform vec3 lightDir;
uniform float shininess;

varying vec3 vNormal;
varying vec3 vPos;
varying vec2 vTexCoord;

void main() {
    vec3 N = normalize(vNormal);
    vec3 L = normalize(lightDir);
    vec3 V = normalize(-vPos);
    vec3 H = normalize(L + V);

    float diff = max(dot(N, L), 0.0);
    float spec = pow(max(dot(N, H), 0.0), shininess);

    vec2 tiledCoord = fract(vTexCoord * 2.0); // texture tiling (2x)
    vec3 Kd = (useTexture == 1) ? texture2D(tex, tiledCoord).rgb : vec3(1.0);

    vec3 ambient = vec3(0.2);
    vec3 color = ambient * Kd + diff * Kd + spec * vec3(1.0);

    gl_FragColor = vec4(color, 1.0);
}`;

class MeshDrawer {
	constructor() {
		this.prog = InitShaderProgram(meshVS, meshFS);
		this.mvpLoc = gl.getUniformLocation(this.prog, 'mvp');
		this.mvLoc = gl.getUniformLocation(this.prog, 'mv');
		this.nLoc = gl.getUniformLocation(this.prog, 'normalMatrix');
		this.yzSwapLoc = gl.getUniformLocation(this.prog, 'yzSwap');
		this.sampler = gl.getUniformLocation(this.prog, 'tex');
		this.useTextureLoc = gl.getUniformLocation(this.prog, 'useTexture');
		this.lightDirLoc = gl.getUniformLocation(this.prog, 'lightDir');
		this.shininessLoc = gl.getUniformLocation(this.prog, 'shininess');

		this.posLoc = gl.getAttribLocation(this.prog, 'position');
		this.normLoc = gl.getAttribLocation(this.prog, 'normal');
		this.texLoc = gl.getAttribLocation(this.prog, 'texCoord');

		this.posBuf = gl.createBuffer();
		this.normBuf = gl.createBuffer();
		this.texBuf = gl.createBuffer();

		this.yzSwapMat = [
			1, 0, 0, 0,
			0, 1, 0, 0,
			0, 0, 1, 0,
			0, 0, 0, 1
		];
	}

	setMesh(vertPos, texCoords, normals) {
		gl.bindBuffer(gl.ARRAY_BUFFER, this.posBuf);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertPos), gl.STATIC_DRAW);
		gl.bindBuffer(gl.ARRAY_BUFFER, this.normBuf);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.STATIC_DRAW);
		gl.bindBuffer(gl.ARRAY_BUFFER, this.texBuf);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texCoords), gl.STATIC_DRAW);
		this.numTriangles = vertPos.length / 3;

		console.log("📌 texCoords.length:", texCoords.length);
		console.log("📌 numTriangles:", this.numTriangles);
		console.log("📌 texCoord sample:", texCoords.slice(0, 6));
	}

	swapYZ(swap) {
		gl.useProgram(this.prog);
		if (swap) {
			this.yzSwapMat = MatrixMult(
				[1, 0, 0, 0, 0, -1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1],
				[1, 0, 0, 0, 0, Math.cos(Math.PI/2), Math.sin(Math.PI/2), 0, 0, -Math.sin(Math.PI/2), Math.cos(Math.PI/2), 0, 0, 0, 0, 1]
			);
		} else {
			this.yzSwapMat = [
				1, 0, 0, 0,
				0, 1, 0, 0,
				0, 0, 1, 0,
				0, 0, 0, 1
			];
		}
	}

	draw(mvp, mv, normalMatrix) {
		gl.useProgram(this.prog);
		gl.uniformMatrix4fv(this.mvpLoc, false, mvp);
		gl.uniformMatrix4fv(this.mvLoc, false, mv);
		gl.uniformMatrix3fv(this.nLoc, false, normalMatrix);
		gl.uniformMatrix4fv(this.yzSwapLoc, false, this.yzSwapMat);

		gl.bindBuffer(gl.ARRAY_BUFFER, this.posBuf);
		gl.enableVertexAttribArray(this.posLoc);
		gl.vertexAttribPointer(this.posLoc, 3, gl.FLOAT, false, 0, 0);

		gl.bindBuffer(gl.ARRAY_BUFFER, this.normBuf);
		gl.enableVertexAttribArray(this.normLoc);
		gl.vertexAttribPointer(this.normLoc, 3, gl.FLOAT, false, 0, 0);

		gl.bindBuffer(gl.ARRAY_BUFFER, this.texBuf);
		gl.enableVertexAttribArray(this.texLoc);
		gl.vertexAttribPointer(this.texLoc, 2, gl.FLOAT, false, 0, 0);

		gl.drawArrays(gl.TRIANGLES, 0, this.numTriangles);
	}

	setTexture(img) {
		const tex = gl.createTexture();
		gl.bindTexture(gl.TEXTURE_2D, tex);
		gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img);
		gl.generateMipmap(gl.TEXTURE_2D);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
		gl.useProgram(this.prog);
		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, tex);
		gl.uniform1i(this.sampler, 0);
		this.showTexture(true);
		console.log("✅ Texture applicata e bindata");
	}

	showTexture(show) {
		gl.useProgram(this.prog);
		gl.uniform1i(this.useTextureLoc, show ? 1 : 0);
		console.log("🟢 showTexture called with:", show);
	}

	setLightDir(x, y, z) {
		gl.useProgram(this.prog);
		const len = Math.sqrt(x*x + y*y + z*z);
		gl.uniform3f(this.lightDirLoc, x/len, y/len, z/len);
	}

	setShininess(s) {
		gl.useProgram(this.prog);
		gl.uniform1f(this.shininessLoc, s);
	}
}
