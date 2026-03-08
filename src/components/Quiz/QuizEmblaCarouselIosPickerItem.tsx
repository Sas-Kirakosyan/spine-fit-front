import React, { useEffect, useCallback, useRef } from 'react'
import useEmblaCarousel from 'embla-carousel-react'
import type {EmblaCarouselType} from 'embla-carousel'

interface IosPickerItemProps {
    items: (string | number)[]
    perspective: 'left' | 'right' | 'center'
    label?: string
    loop?: boolean
    onSelect?: (value: string | number) => void
    startIndex?: number;
}

const CIRCLE_DEGREES = 360
const WHEEL_ITEM_SIZE = 32
const WHEEL_ITEM_COUNT = 18
const WHEEL_ITEMS_IN_VIEW = 4

const WHEEL_ITEM_RADIUS = CIRCLE_DEGREES / WHEEL_ITEM_COUNT
const IN_VIEW_DEGREES = WHEEL_ITEM_RADIUS * WHEEL_ITEMS_IN_VIEW
const WHEEL_RADIUS = Math.round(
    WHEEL_ITEM_SIZE / 2 / Math.tan(Math.PI / WHEEL_ITEM_COUNT)
)

const isInView = (wheelLocation: number, slidePosition: number): boolean =>
    Math.abs(wheelLocation - slidePosition) < IN_VIEW_DEGREES

const setSlideStyles = (
    emblaApi: EmblaCarouselType,
    index: number,
    loop: boolean,
    slideCount: number,
    totalRadius: number
): void => {
    const slideNode = emblaApi.slideNodes()[index]
    const snapList = emblaApi.scrollSnapList()

    const wheelLocation = emblaApi.scrollProgress() * totalRadius
    const positionDefault = snapList[index] * totalRadius
    const positionLoopStart = positionDefault + totalRadius
    const positionLoopEnd = positionDefault - totalRadius

    let inView = false
    let angle = index * -WHEEL_ITEM_RADIUS

    if (isInView(wheelLocation, positionDefault)) {
        inView = true
    }

    if (loop && isInView(wheelLocation, positionLoopEnd)) {
        inView = true
        angle = -CIRCLE_DEGREES + (slideCount - index) * WHEEL_ITEM_RADIUS
    }

    if (loop && isInView(wheelLocation, positionLoopStart)) {
        inView = true
        angle = -(totalRadius % CIRCLE_DEGREES) - index * WHEEL_ITEM_RADIUS
    }

    if (inView) {
        slideNode.style.opacity = '1'
        slideNode.style.transform = `translateY(-${
            index * 100
        }%) rotateX(${angle}deg) translateZ(${WHEEL_RADIUS}px)`
    } else {
        slideNode.style.opacity = '0';
        slideNode.style.transform = `translateY(-${index * 100}%) rotateX(${angle}deg) translateZ(${WHEEL_RADIUS}px)`;
    }
}

const setContainerStyles = (
    emblaApi: EmblaCarouselType,
    wheelRotation: number
): void => {
    emblaApi.containerNode().style.transform = `translateZ(${WHEEL_RADIUS}px) rotateX(${wheelRotation}deg)`
}

export const IosPickerItem: React.FC<IosPickerItemProps> = (props) => {
    const { items, perspective, label, loop = false, startIndex = 0, onSelect } = props
    const slideCount = items.length
    const [emblaRef, emblaApi] = useEmblaCarousel({
        axis: 'y',
        loop: false,
        dragFree: true,
        containScroll: 'trimSnaps',
        startIndex,
        skipSnaps: true,
        duration: 25,
    });


    const rootNodeRef = useRef<HTMLDivElement>(null)
    const totalRadius = slideCount * WHEEL_ITEM_RADIUS
    const rotationOffset = loop ? 0 : WHEEL_ITEM_RADIUS

    const inactivateEmblaTransform = useCallback((emblaApi: EmblaCarouselType) => {
        if (!emblaApi) return

        const { translate, slideLooper } = emblaApi.internalEngine()
        translate.clear()
        translate.toggleActive(false)

        slideLooper.loopPoints.forEach((loopPoint) => {
            loopPoint.translate.clear()
            loopPoint.translate.toggleActive(false)
        })
    }, [])

    const rotateWheel = useCallback(
        (emblaApi: EmblaCarouselType) => {
            const rotation = slideCount * WHEEL_ITEM_RADIUS - rotationOffset
            const wheelRotation = rotation * emblaApi.scrollProgress()
            setContainerStyles(emblaApi, wheelRotation)
            emblaApi.slideNodes().forEach((_, index) => {
                setSlideStyles(emblaApi, index, loop, slideCount, totalRadius)
            })
        },
        [slideCount, rotationOffset, totalRadius, loop]
    )

    useEffect(() => {
        if (!emblaApi) return

        emblaApi.on('pointerUp', (api) => {
            const { scrollTo, target, location } = api.internalEngine()
            const displacement = target.get() - location.get()
            const factor = Math.abs(displacement) < WHEEL_ITEM_SIZE / 2.5 ? 10 : 0.1
            const distance = displacement * factor
            scrollTo.distance(distance, true)
        })

        emblaApi.on('scroll', rotateWheel)

        emblaApi.on('select', () => {
            if (onSelect) onSelect(items[emblaApi.selectedScrollSnap()])
        })

        emblaApi.on('reInit', (api) => {
            inactivateEmblaTransform(api)
            rotateWheel(api)
        })

        inactivateEmblaTransform(emblaApi)
        rotateWheel(emblaApi)
    }, [emblaApi, inactivateEmblaTransform, rotateWheel, items, onSelect])

    return (
        <div className="embla__ios-picker  h-full flex items-center justify-center flex-1 leading-none text-[1.8rem]">
            <div className="min-w-full h-full overflow-hidden flex items-center touch-pan-x" ref={rootNodeRef}>
                <div
                    className={`h-[32px] w-full [perspective:1000px] touch-none select-none [-webkit-user-select:none] [-webkit-touch-callout:none] [-webkit-tap-highlight-color:transparent] ${
                        perspective === 'left' ? '[perspective-origin:calc(50%+130px)_50%] translate-x-[27px]' : ''
                    } ${
                        perspective === 'right' ? '[perspective-origin:calc(50%-130px)_50%] -translate-x-[27px]' : ''
                    } ${
                        perspective === 'center' ? '[perspective-origin:50%_50%]' : ''
                    }`}
                    ref={emblaRef}
                >
                    <div className="h-full w-full [transform-style:preserve-3d]">
                        {items.map((item, index) => (
                            <div className="w-full h-full text-[19px] text-center flex items-center text-white justify-center [backface-visibility:hidden] [transform:translateZ(0)]" key={index}>
                                {item}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            {label && <div className="font-bold -translate-x-[55px] pointer-events-none">{label}</div>}
        </div>
    )
}