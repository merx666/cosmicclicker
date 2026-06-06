import { Slide, TransitionType, TextAnimation, BorderAnimation } from './types';

// Relying on CDN scripts loaded in page.tsx
// @ts-ignore
declare const htmlToImage: any;
// @ts-ignore
declare const gifshot: any;

const FPS = 10;

const createSolidFrame = (width: number, height: number, color: string): string => {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (ctx) {
        ctx.fillStyle = color;
        ctx.fillRect(0, 0, width, height);
    }
    return canvas.toDataURL('image/png');
};

export const generateGif = async (
    elementId: string,
    slides: Slide[],
    setSlideCallback: (id: string) => void,
    setCaptureTimeCallback: (time: number | undefined) => void,
    width: number,
    height: number
): Promise<string> => {

    // Verify libs exist
    // @ts-ignore
    if (typeof htmlToImage === 'undefined' || typeof gifshot === 'undefined') {
        throw new Error("Libraries not loaded. Please refresh the page.");
    }

    const images: string[] = [];

    for (const slide of slides) {
        if (slide.transitionType === TransitionType.FLASH_WHITE) {
            images.push(createSolidFrame(width, height, '#ffffff'));
            images.push(createSolidFrame(width, height, '#ffffff'));
        } else if (slide.transitionType === TransitionType.BLACKOUT) {
            images.push(createSolidFrame(width, height, '#000000'));
            images.push(createSolidFrame(width, height, '#000000'));
        }

        setSlideCallback(slide.id);

        // Check animations
        const isAnimated =
            slide.headlineAnimation !== TextAnimation.NONE ||
            slide.subtextAnimation !== TextAnimation.NONE ||
            (slide.borderAnimation !== BorderAnimation.NONE && slide.borderAnimation !== BorderAnimation.SOLID);

        const framesCount = Math.floor(slide.duration * FPS);
        const node = document.getElementById(elementId);

        if (!node) throw new Error("Preview element not found");

        if (isAnimated) {
            for (let i = 0; i < framesCount; i++) {
                setCaptureTimeCallback(Date.now());
                await new Promise(resolve => setTimeout(resolve, 50));
                try {
                    // @ts-ignore
                    const dataUrl = await htmlToImage.toPng(node, {
                        width: width,
                        height: height,
                        pixelRatio: 1,
                        skipAutoScale: true,
                        cacheBust: true,
                    });
                    images.push(dataUrl);
                } catch (error) {
                    console.error("Error capturing animated frame:", error);
                }
            }
        } else {
            setCaptureTimeCallback(0);
            await new Promise(resolve => setTimeout(resolve, 50));
            try {
                // @ts-ignore
                const dataUrl = await htmlToImage.toPng(node, {
                    width: width,
                    height: height,
                    pixelRatio: 1,
                    skipAutoScale: true,
                });
                for (let i = 0; i < framesCount; i++) {
                    images.push(dataUrl);
                }
            } catch (error) {
                console.error("Error capturing static frame:", error);
            }
        }
    }

    setCaptureTimeCallback(undefined);

    return new Promise((resolve, reject) => {
        // @ts-ignore
        gifshot.createGIF({
            images: images,
            gifWidth: width,
            gifHeight: height,
            interval: 1 / FPS,
            numFrames: FPS,
        }, (obj: any) => {
            if (!obj.error) {
                resolve(obj.image);
            } else {
                reject(obj.errorMsg);
            }
        });
    });
};
