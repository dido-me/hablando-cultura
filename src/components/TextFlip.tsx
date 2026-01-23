import { useState, useEffect } from 'react';

interface Platform {
    name: string;
    color: string;
    image: string;
}

interface TextFlipProps {
    platforms: Platform[];
    interval?: number;
}

// Componente para cada letra con efecto flip 3D estilo split-flap
function FlipLetter({ 
    char, 
    isFlipping, 
    delay, 
    color 
}: { 
    char: string; 
    isFlipping: boolean; 
    delay: number;
    color: string;
}) {
    return (
        <span 
            className="inline-block"
            style={{ 
                perspective: '1000px',
                perspectiveOrigin: '50% 50%',
            }}
        >
            <span
                className="inline-block font-bold"
                style={{
                    color: color,
                    transformStyle: 'preserve-3d',
                    transform: isFlipping ? 'rotateX(360deg)' : 'rotateX(0deg)',
                    transformOrigin: 'center center',
                    transition: `transform 0.6s cubic-bezier(0.23, 1, 0.32, 1)`,
                    transitionDelay: `${delay}ms`,
                    display: 'inline-block',
                }}
            >
                {char === ' ' ? '\u00A0' : char}
            </span>
        </span>
    );
}

export default function TextFlip({ platforms, interval = 3500 }: TextFlipProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipping, setIsFlipping] = useState(false);
    const [displayedPlatform, setDisplayedPlatform] = useState(platforms[0]);

    useEffect(() => {
        const timer = setInterval(() => {
            // Iniciar animación de flip
            setIsFlipping(true);
            
            // A mitad de la animación, cambiar el texto
            setTimeout(() => {
                const nextIndex = (currentIndex + 1) % platforms.length;
                setDisplayedPlatform(platforms[nextIndex]);
                setCurrentIndex(nextIndex);
            }, 300);
            
            // Terminar la animación
            setTimeout(() => {
                setIsFlipping(false);
            }, 700);
        }, interval);

        return () => clearInterval(timer);
    }, [platforms, currentIndex, interval]);

    const letters = displayedPlatform.name.split('');

    return (
        <div className="flex flex-col md:flex-row items-center justify-center gap-4">
            <span className="text-3xl md:text-5xl font-medium tracking-tight text-white">
                Más contenido en
            </span>
            
            {/* Contenedor de la imagen */}
            <div className="relative group cursor-pointer mx-2">
                <div 
                    className="absolute -inset-2 rounded-2xl blur-xl transition-all duration-500"
                    style={{
                        background: displayedPlatform.color,
                        opacity: 0.4,
                    }}
                />
                <div 
                    className="relative w-40 h-24 md:w-56 md:h-28 rounded-xl overflow-hidden ring-1 ring-white/10 shadow-2xl"
                    style={{ perspective: '1000px' }}
                >
                    <div
                        className="w-full h-full transition-transform duration-700"
                        style={{
                            transformStyle: 'preserve-3d',
                            transform: isFlipping ? 'rotateY(180deg)' : 'rotateY(0deg)',
                        }}
                    >
                        <img 
                            alt={displayedPlatform.name}
                            className="absolute inset-0 w-full h-full object-cover"
                            style={{ backfaceVisibility: 'hidden' }}
                            src={displayedPlatform.image}
                        />
                        <img 
                            alt={displayedPlatform.name}
                            className="absolute inset-0 w-full h-full object-cover"
                            style={{ 
                                backfaceVisibility: 'hidden',
                                transform: 'rotateY(180deg)',
                            }}
                            src={displayedPlatform.image}
                        />
                    </div>
                    {/* Overlay con icono de play */}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/10 transition-colors z-10">
                        <div 
                            className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-all duration-300"
                            style={{
                                backgroundColor: displayedPlatform.color,
                            }}
                        >
                            <span className="material-symbols-outlined text-white text-2xl">play_arrow</span>
                        </div>
                    </div>
                </div>
            </div>
            
            {/* Texto con efecto flip 3D letra por letra */}
            <span className="inline-flex text-3xl md:text-5xl tracking-tight">
                {letters.map((char, index) => (
                    <FlipLetter
                        key={`${currentIndex}-${index}`}
                        char={char}
                        isFlipping={isFlipping}
                        delay={index * 40}
                        color={displayedPlatform.color}
                    />
                ))}
            </span>
        </div>
    );
}
