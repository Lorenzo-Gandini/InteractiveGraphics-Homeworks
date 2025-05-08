// This function takes the projection matrix, the translation, and two rotation angles (in radians) as input arguments.
// The two rotations are applied around x and y axes.
// It returns the combined 4x4 transformation matrix as an array in column-major order.
// The given projection matrix is also a 4x4 matrix stored as an array in column-major order.
// You can use the MatrixMult function defined in project4.html to multiply two 4x4 matrices in the same format.
// === MATRIX ===
function GetModelViewProjection(projectionMatrix, translationX, translationY, translationZ, rotationX, rotationY) {
	const cosX = Math.cos(rotationX);
	const sinX = Math.sin(rotationX);
	const cosY = Math.cos(rotationY);
	const sinY = Math.sin(rotationY);

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

	const mv = MatrixMult(trans, MatrixMult(rotY, rotX));
	return MatrixMult(projectionMatrix, mv);
}


// === SHADERS ===
const meshVS = `
    attribute vec3 pos;
    attribute vec2 texCoord;

    uniform mat4 mvp;
    uniform mat4 yzSwap;

    varying vec2 vTexCoord;

    void main() {
        gl_Position = mvp * yzSwap * vec4(pos, 1.0);
        vTexCoord = texCoord;
    }
`;


const meshFS = `
    precision mediump float;

    uniform sampler2D tex;
    uniform bool useTexture;

    varying vec2 vTexCoord;

    void main() {
        if (useTexture) {
            vec2 tiledCoord = fract(vTexCoord * 2.0);
            gl_FragColor = texture2D(tex, tiledCoord);
        } else {
            gl_FragColor = vec4(1.0, gl_FragCoord.z * gl_FragCoord.z, 0.0, 1.0);
        } 
    }
`;


class MeshDrawer {
	constructor() {
		this.prog = InitShaderProgram(meshVS, meshFS);
		this.mvpLoc = gl.getUniformLocation(this.prog, 'mvp');
		this.sampler = gl.getUniformLocation(this.prog, 'tex');
		this.useTextureLoc = gl.getUniformLocation(this.prog, 'useTexture');
		this.yzSwapLoc = gl.getUniformLocation(this.prog, 'yzSwap');

		this.posLoc = gl.getAttribLocation(this.prog, 'pos');
		this.texLoc = gl.getAttribLocation(this.prog, 'texCoord');

		this.vertBuf = gl.createBuffer();
		this.texBuf = gl.createBuffer();

		this.texture = gl.createTexture();
		gl.bindTexture(gl.TEXTURE_2D, this.texture);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

		this.numTriangles = 0;
		this.hasTexture = false;
		this.hasTexCoords = false;

		this.yzSwapMat = [
			1, 0, 0, 0,
			0, 1, 0, 0,
			0, 0, 1, 0,
			0, 0, 0, 1
		];
	}

	setMesh(vertPos, texCoords) {
		this.numTriangles = vertPos.length / 3;

		gl.bindBuffer(gl.ARRAY_BUFFER, this.vertBuf);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertPos), gl.STATIC_DRAW);

		if (texCoords && texCoords.length > 0) {
			gl.bindBuffer(gl.ARRAY_BUFFER, this.texBuf);
			gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texCoords), gl.STATIC_DRAW);
			this.hasTexCoords = true;
		} else {
			this.hasTexCoords = false;
		}
	}

	setTexture(img) {
		gl.bindTexture(gl.TEXTURE_2D, this.texture);
		gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
		this.hasTexture = true;
	}

	showTexture(show) {
		gl.useProgram(this.prog);
		gl.uniform1i(this.useTextureLoc, show ? 1 : 0);
	}

	swapYZ(swap) {
		gl.useProgram(this.prog);
		if (swap) {
			this.yzSwapMat = MatrixMult(
				[1, 0, 0, 0, 0, -1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1],
				[1, 0, 0, 0, 0, Math.cos(Math.PI/2), Math.sin(Math.PI/2), 0,
				 0, -Math.sin(Math.PI/2), Math.cos(Math.PI/2), 0, 0, 0, 0, 1]
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

	draw(matrixMVP) {
		gl.useProgram(this.prog);
		gl.uniformMatrix4fv(this.mvpLoc, false, matrixMVP);
		gl.uniformMatrix4fv(this.yzSwapLoc, false, this.yzSwapMat);
		gl.uniform1i(this.useTextureLoc, this.hasTexture && this.hasTexCoords);

		if (this.hasTexture && this.hasTexCoords) {
			gl.activeTexture(gl.TEXTURE0);
			gl.bindTexture(gl.TEXTURE_2D, this.texture);
			gl.uniform1i(this.sampler, 0);
		}

		gl.bindBuffer(gl.ARRAY_BUFFER, this.vertBuf);
		gl.enableVertexAttribArray(this.posLoc);
		gl.vertexAttribPointer(this.posLoc, 3, gl.FLOAT, false, 0, 0);

		if (this.hasTexCoords) {
			gl.bindBuffer(gl.ARRAY_BUFFER, this.texBuf);
			gl.enableVertexAttribArray(this.texLoc);
			gl.vertexAttribPointer(this.texLoc, 2, gl.FLOAT, false, 0, 0);
		}

		gl.drawArrays(gl.TRIANGLES, 0, this.numTriangles);
	}
}

