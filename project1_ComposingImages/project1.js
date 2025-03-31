function composite(bgImg, fgImg, fgOpac, fgPos) {
    
    //console.log("fgOpac:", fgOpac);

    for (let fg_y = 0; fg_y < fgImg.height; fg_y++) {
        for (let fg_x = 0; fg_x < fgImg.width; fg_x++) {
            let bg_x = fg_x + fgPos.x;
            let bg_y = fg_y + fgPos.y;

            if (bg_x < 0 || bg_y < 0 || bg_x >= bgImg.width || bg_y >= bgImg.height) {
                continue;
            }

            let fg_index = ((fg_y * fgImg.width) + fg_x) * 4;
            let bg_index = ((bg_y * bgImg.width) + bg_x) * 4;

            let alpha = (fgImg.data[fg_index + 3]) / 255;
            let fg_alpha = fgOpac * alpha;
            let bg_alpha = 1 - fg_alpha;

            //console.log(alpha, fg_alpha, bg_alpha);

            // Update the channels
            bgImg.data[bg_index] = fgImg.data[fg_index] * fg_alpha + bgImg.data[bg_index] * bg_alpha;               // Red
            bgImg.data[bg_index + 1] = fgImg.data[fg_index + 1] * fg_alpha + bgImg.data[bg_index + 1] * bg_alpha;   // Green
            bgImg.data[bg_index + 2] = fgImg.data[fg_index + 2] * fg_alpha + bgImg.data[bg_index + 2] * bg_alpha;   // Blue
            bgImg.data[bg_index + 3] = (fg_alpha + bgImg.data[bg_index + 3] / 255 * bg_alpha) * 255;                // Alpha
        }
    }
}
