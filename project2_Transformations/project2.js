// // Returns a 3x3 transformation matrix as an array of 9 values in column-major order.
// // The transformation first applies scale, then rotation, and finally translation.
// // The given rotation value is in degrees.
// function GetTransform(positionX, positionY, rotation, scale) {
	
// 	let scaleMatrix = [
// 		scale, 0, 0,
// 		0, scale, 0,
// 		0, 0, 1
// 	];

// 	let rad = rotation * (Math.PI / 180);

// 	let rotationMatrix = [
// 		Math.cos(rad), -Math.sin(rad), 0,
// 		Math.sin(rad), Math.cos(rad), 0,
// 		0, 0, 1
// 	];

	
// 	let translationMatrix = [
// 		1, 0, positionX,
// 		0, 1, positionY,
// 		0, 0, 1
// 	];

// 	// scale * rotation * translation
// 	let combinedMatrix = ApplyTransform(scaleMatrix, ApplyTransform(translationMatrix, rotationMatrix));
// 	return combinedMatrix;
// }


// // Returns a 3x3 transformation matrix as an array of 9 values in column-major order.
// // The arguments are transformation matrices in the same format.
// // The returned transformation first applies trans1 and then trans2.
// function ApplyTransform(trans1, trans2) {
//     let result = new Array(9).fill(0);

//     for (let col = 0; col < 3; col++) {  
//         for (let row = 0; row < 3; row++) {  
//             let sum = 0;
//             for (let k = 0; k < 3; k++) {  
//                 sum += trans1[k * 3 + row] * trans2[col * 3 + k];  // Indici corretti
//             }
// 			console.log("index: ",(col * 3 + row),"Sum:", sum);
//             result[col * 3 + row] = sum; 
//         }
//     }

// 	console.log("Applied Transform:", result);
//     return result;
// }


// Returns a 3x3 transformation matrix as an array of 9 values in column-major order.
// The transformation first applies scale, then rotation, and finally translation.
function GetTransform(positionX, positionY, rotation, scale) {
    const theta = rotation * (Math.PI / 180);

    let scaleArray = [
        scale, 0, 0,
        0, scale, 0,
        0, 0, 1
    ];

    let rotateArray = [
        Math.cos(theta), Math.sin(theta), 0,
        -Math.sin(theta), Math.cos(theta), 0,
        0, 0, 1
    ];

    let translateArray = [
        1, 0, positionX,
        0, 1, positionY,
        0, 0, 1
    ];

    // M = translate * (rotate * scale)
    return ApplyTransform(translateArray, ApplyTransform(rotateArray, scaleArray));
}

// Returns a 3x3 transformation matrix as an array of 9 values in column-major order.
// The arguments are transformation matrices in the same format.
// The returned transformation first applies trans1 and then trans2.
function ApplyTransform(trans1, trans2) {
    let result = new Array(9).fill(0);

    for (let col = 0; col < 3; col++) {  
        for (let row = 0; row < 3; row++) {  
            let sum = 0;
            for (let k = 0; k < 3; k++) {  
                sum += trans1[k * 3 + row] * trans2[col * 3 + k];  
            }
            result[col * 3 + row] = sum;
        }
    }

    return result;
}

