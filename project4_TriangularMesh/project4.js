// This function takes the projection matrix, the translation, and two rotation angles (in radians) as input arguments.
// The two rotations are applied around x and y axes.
// It returns the combined 4x4 transformation matrix as an array in column-major order.
// The given projection matrix is also a 4x4 matrix stored as an array in column-major order.
// You can use the MatrixMult function defined in project4.html to multiply two 4x4 matrices in the same format.
function GetModelViewProjection( projectionMatrix, translationX, translationY, translationZ, rotationX, rotationY ){
	// RotX
	var cosX = Math.cos(rotationX);
	var sinX = Math.sin(rotationX);
	var rotX = [
		1,    0,     0, 0,
		0, cosX, sinX, 0,
		0, -sinX, cosX, 0,
		0,    0,     0, 1
	];

	// RotY
	var cosY = Math.cos(rotationY);
	var sinY = Math.sin(rotationY);
	var rotY = [
		cosY, 0, -sinY, 0,
		0, 1,     0, 0,
		sinY, 0,  cosY, 0,
		0, 0,     0, 1
	];

	// Translation
	var trans = [
		1, 0, 0, 0,
		0, 1, 0, 0,
		0, 0, 1, 0,
		translationX, translationY, translationZ, 1
	];

	// T * Ry * Rx
	var mv = MatrixMult( trans, MatrixMult( rotY, rotX ) );
	var mvp = MatrixMult(projectionMatrix, mv); // Use projectionMatrix
	
	return mvp;
}


// === SHADERS ===
const meshVS = `
    attribute vec3 pos;
    attribute vec2 texCoord;
    uniform mat4 mvp;
    varying vec2 vTexCoord;

    void main() {
        gl_Position = mvp * vec4(pos, 1.0);
        vTexCoord = texCoord;
    }
`;

const meshFS = `
    precision mediump float;
    varying vec2 vTexCoord;
    uniform sampler2D tex;
    uniform bool useTexture;

    void main() {
        if (useTexture) {
            vec2 tiledCoord = fract(vTexCoord);
            gl_FragColor = texture2D(tex, tiledCoord);
        } else {
            gl_FragColor = vec4(1.0, gl_FragCoord.z * gl_FragCoord.z, 0.0, 1.0);
        }
    }
`;


class MeshDrawer {
    constructor() {
        // Compile shaders
        this.prog = InitShaderProgram(meshVS, meshFS);
        this.mvp = gl.getUniformLocation(this.prog, 'mvp');
        this.sampler = gl.getUniformLocation(this.prog, 'tex');
        this.useTexture = gl.getUniformLocation(this.prog, 'useTexture');

        // Attribute locations
        this.vertPos = gl.getAttribLocation(this.prog, 'pos');
        this.texCoord = gl.getAttribLocation(this.prog, 'texCoord');

        // Buffers
        this.vertbuffer = gl.createBuffer();
        this.texbuffer = gl.createBuffer();

        // Texture
        this.texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

        // Defaults
        this.numTriangles = 0;
        this.hasTexture = false;
    }

	setMesh(vertPos, texCoords) {
		this.numTriangles = vertPos.length / 3;
	
		// Vertex positions
		gl.bindBuffer(gl.ARRAY_BUFFER, this.vertbuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertPos), gl.STATIC_DRAW);
	
		// Texture coordinates
		if (texCoords && texCoords.length > 0) {
			gl.bindBuffer(gl.ARRAY_BUFFER, this.texbuffer);
			gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texCoords), gl.STATIC_DRAW);
			this.hasTexCoords = true;
		} else {
			this.hasTexCoords = false;
		}
	}

    setTexture(img) {
        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true); // flip the image
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA,
                      gl.UNSIGNED_BYTE, img);
        this.hasTexture = true;
    }

draw(matrixMVP) {
    gl.useProgram(this.prog);
    gl.uniformMatrix4fv(this.mvp, false, matrixMVP);
    gl.uniform1i(this.useTexture, this.hasTexture && this.hasTexCoords);

    if (this.hasTexture && this.hasTexCoords) {
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        gl.uniform1i(this.sampler, 0);
    }

    // Position attribute
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertbuffer);
    gl.enableVertexAttribArray(this.vertPos);
    gl.vertexAttribPointer(this.vertPos, 3, gl.FLOAT, false, 0, 0);

    // Texture attribute
    if (this.hasTexCoords) {
        gl.bindBuffer(gl.ARRAY_BUFFER, this.texbuffer);
        gl.enableVertexAttribArray(this.texCoord);
        gl.vertexAttribPointer(this.texCoord, 2, gl.FLOAT, false, 0, 0);
    }

    gl.drawArrays(gl.TRIANGLES, 0, this.numTriangles);

	console.log("Drawing", this.numTriangles, "triangles");
	console.log("Has texture:", this.hasTexture);
console.log("TexCoord attrib:", this.texCoord);

}

}
