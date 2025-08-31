// =============================================================================
// CONFIGURACIÓN DEL JUEGO
// =============================================================================

// Lista de todos los objetos del juego
const gameObjects = [
    'BOTAS', 'BUFANDA', 'CAMPERA', 'Globo Amarillo', 'Globo Azul', 
    'Globo Blanco', 'Globo Naranja', 'Globo Negro', 'Globo Rojo', 
    'Globo Rosa', 'Globo Verde', 'GORRO', 'GUANTES', 'LLUVIA', 
    'NENA', 'NENE', 'NUBES', 'PARAGUAS', 'SOL', 'VIENTO'
];

// Variables del estado del juego
let currentScore = 0;           // Puntuación actual del jugador
let remainingObjects = [...gameObjects];  // Objetos que quedan por adivinar
let currentAudio = null;        // Audio que se está reproduciendo actualmente
let currentTargetObject = null; // Objeto que el jugador debe encontrar
let isAudioPlaying = false;     // Control para evitar clicks múltiples

// Elementos del DOM que usaremos frecuentemente
const startScreen = document.getElementById('startScreen');
const gameScreen = document.getElementById('gameScreen');
const victoryScreen = document.getElementById('victoryScreen');
const startButton = document.getElementById('startButton');
const playAudioButton = document.getElementById('playAudioButton');
const playAgainButton = document.getElementById('playAgainButton');
const scoreDisplay = document.getElementById('score');
const finalScoreDisplay = document.getElementById('finalScore');
const objectsContainer = document.getElementById('objectsContainer');
const marianaStart = document.getElementById('marianaStart');
const marianaGame = document.getElementById('marianaGame');

// =============================================================================
// FUNCIONES DE UTILIDAD
// =============================================================================

/**
 * Función para mezclar aleatoriamente un array (algoritmo Fisher-Yates)
 * @param {Array} array - El array que queremos mezclar
 * @returns {Array} - Una copia del array mezclada aleatoriamente
 */
function shuffleArray(array) {
    const shuffled = [...array]; // Crear una copia del array
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]; // Intercambiar elementos
    }
    return shuffled;
}

/**
 * Función para seleccionar un elemento aleatorio de un array
 * @param {Array} array - El array del cual queremos seleccionar
 * @returns {*} - Un elemento aleatorio del array
 */
function getRandomElement(array) {
    return array[Math.floor(Math.random() * array.length)];
}

/**
 * Función para cambiar entre pantallas con transición suave
 * @param {HTMLElement} hideScreen - Pantalla a ocultar
 * @param {HTMLElement} showScreen - Pantalla a mostrar
 */
function changeScreen(hideScreen, showScreen) {
    hideScreen.classList.remove('active');
    setTimeout(() => {
        showScreen.classList.add('active');
    }, 100);
}

/**
 * Función para actualizar la puntuación en pantalla
 * @param {number} points - Puntos a sumar
 */
function updateScore(points) {
    currentScore += points;
    scoreDisplay.textContent = `${currentScore}/200`;
}

// =============================================================================
// FUNCIONES DE AUDIO Y ANIMACIÓN
// =============================================================================

/**
 * Función para actualizar el estado visual del botón de audio
 * @param {string} state - Estado del botón: 'new', 'playing', 'repeat'
 */
function updateAudioButtonState(state) {
    const button = playAudioButton;
    const buttonText = button.querySelector('.button-text');
    
    button.dataset.state = state;
    
    switch(state) {
        case 'new':
            buttonText.textContent = '🔊 הַשְׁמֵעַ קוֹל';
            break;
        case 'playing':
            buttonText.textContent = '🔄 מַשְׁמִיעַ';
            break;
        case 'repeat':
            buttonText.textContent = '🔁 הַשְׁמֵעַ עוֹד פַּעַם';
            break;
    }
}

/**
 * Función para actualizar el estado visual del botón de inicio
 * @param {string} state - Estado del botón: 'start', 'playing'
 */
function updateStartButtonState(state) {
    const button = startButton;
    const buttonText = button.querySelector('.button-text');
    
    switch(state) {
        case 'start':
            buttonText.textContent = '🚀 הַתְחֵל מִשְׂחָק 🚀';
            button.style.pointerEvents = 'auto';
            button.style.cursor = 'pointer';
            button.style.background = 'linear-gradient(45deg, #4CAF50, #45a049)';
            break;
        case 'playing':
            buttonText.textContent = '🔄 מַשְׁמִיעַ';
            button.style.pointerEvents = 'none';
            button.style.cursor = 'not-allowed';
            button.style.background = 'linear-gradient(45deg, #FFA726, #FF9800)';
            break;
    }
}

/**
 * Función para reproducir audio y animar a Mariana mientras habla
 * @param {string} audioPath - Ruta del archivo de audio
 * @param {HTMLElement} marianaElement - Elemento de imagen de Mariana
 * @param {Function} onComplete - Función a ejecutar cuando termina el audio
 */
function playAudioWithAnimation(audioPath, marianaElement, onComplete = null) {
    const audio = new Audio(audioPath);
    let animationInterval;
    
    // Función para alternar la imagen de Mariana
    function toggleMarianaImage() {
        const currentSrc = marianaElement.src;
        if (currentSrc.includes('mariana_boca_cerrada.png')) {
            marianaElement.src = 'assets/images/mariana_boca_abierta.png';
        } else {
            marianaElement.src = 'assets/images/mariana_boca_cerrada.png';
        }
    }
    
    // Iniciar la animación cuando empiece el audio
    audio.addEventListener('play', () => {
        animationInterval = setInterval(toggleMarianaImage, 300); // Cambiar cada 0.3 segundos
    });
    
    // Detener la animación cuando termine el audio
    audio.addEventListener('ended', () => {
        clearInterval(animationInterval);
        marianaElement.src = 'assets/images/mariana_boca_cerrada.png'; // Volver a boca cerrada
        if (onComplete) {
            onComplete();
        }
    });
    
    audio.play();
    return audio;
}

/**
 * Función para reproducir audio de un objeto específico
 * @param {string} objectName - Nombre del objeto
 */
function playObjectAudio(objectName) {
    if (isAudioPlaying) return; // Evitar clicks múltiples
    
    isAudioPlaying = true;
    currentTargetObject = objectName;
    
    // Cambiar estado del botón a "reproduciendo"
    updateAudioButtonState('playing');
    
    const audioPath = `assets/audio/${objectName}.mp3`;
    currentAudio = new Audio(audioPath);
    
    // Iniciar animación de Mariana
    let animationInterval = setInterval(() => {
        const currentSrc = marianaGame.src;
        if (currentSrc.includes('mariana_boca_cerrada.png')) {
            marianaGame.src = 'assets/images/mariana_boca_abierta.png';
        } else {
            marianaGame.src = 'assets/images/mariana_boca_cerrada.png';
        }
    }, 300); // Cambiar cada 0.3 segundos
    
    currentAudio.addEventListener('ended', () => {
        // Detener animación
        clearInterval(animationInterval);
        marianaGame.src = 'assets/images/mariana_boca_cerrada.png';
        
        isAudioPlaying = false;
        // Cambiar el estado del botón a "repetir"
        updateAudioButtonState('repeat');
    });
    
    currentAudio.play();
}

// =============================================================================
// FUNCIONES DE MANEJO DEL JUEGO
// =============================================================================

/**
 * Función para generar las imágenes de objetos en la pantalla
 */
function generateGameObjects() {
    objectsContainer.innerHTML = ''; // Limpiar el contenedor
    
    // Mezclar los objetos restantes para mostrar en orden aleatorio
    const shuffledObjects = shuffleArray(remainingObjects);
    
    // Crear elementos para cada objeto
    shuffledObjects.forEach(objectName => {
        const objectDiv = document.createElement('div');
        objectDiv.className = 'game-object';
        objectDiv.dataset.objectName = objectName;
        
        const objectImg = document.createElement('img');
        objectImg.src = `assets/images/${objectName}.png`;
        objectImg.alt = objectName;
        
        objectDiv.appendChild(objectImg);
        
        // Agregar evento de click
        objectDiv.addEventListener('click', () => handleObjectClick(objectName, objectDiv));
        
        objectsContainer.appendChild(objectDiv);
    });
}

/**
 * Función para manejar el click en un objeto
 * @param {string} clickedObject - Nombre del objeto clickeado
 * @param {HTMLElement} objectElement - Elemento DOM del objeto
 */
function handleObjectClick(clickedObject, objectElement) {
    if (!currentTargetObject || isAudioPlaying) return; // No hacer nada si no hay audio objetivo
    
    if (clickedObject === currentTargetObject) {
        // ¡Respuesta correcta!
        handleCorrectAnswer(objectElement);
    } else {
        // Respuesta incorrecta
        handleIncorrectAnswer(objectElement);
    }
}

/**
 * Función para crear efectos visuales de celebración
 */
function createCelebrationEffect() {
    // Crear confetti simple con emojis
    const celebrationEmojis = ['🎉', '⭐', '✨', '🌟', '🎊'];
    
    for (let i = 0; i < 10; i++) {
        setTimeout(() => {
            const emoji = document.createElement('div');
            emoji.textContent = celebrationEmojis[Math.floor(Math.random() * celebrationEmojis.length)];
            emoji.style.position = 'fixed';
            emoji.style.left = Math.random() * window.innerWidth + 'px';
            emoji.style.top = '-50px';
            emoji.style.fontSize = '30px';
            emoji.style.zIndex = '1000';
            emoji.style.pointerEvents = 'none';
            emoji.style.animation = 'celebrationFall 3s ease-out forwards';
            
            document.body.appendChild(emoji);
            
            // Remover el elemento después de la animación
            setTimeout(() => {
                if (emoji.parentNode) {
                    emoji.parentNode.removeChild(emoji);
                }
            }, 3000);
        }, i * 100);
    }
}

/**
 * Función para manejar respuesta correcta
 * @param {HTMLElement} objectElement - Elemento del objeto correcto
 */
function handleCorrectAnswer(objectElement) {
    // Reproducir sonido de respuesta correcta
    const correctSound = new Audio('assets/audio/audio-correct (1).mp3');
    correctSound.play();
    
    // Añadir animación de respuesta correcta
    objectElement.classList.add('correct');
    
    // Crear efecto de celebración
    createCelebrationEffect();
    
    // Sumar puntos
    updateScore(10);
    
    // Remover el objeto de la lista de objetos restantes
    remainingObjects = remainingObjects.filter(obj => obj !== currentTargetObject);
    
    // Esperar a que termine la animación antes de regenerar objetos
    setTimeout(() => {
        // Verificar si el juego ha terminado
        if (currentScore >= 200) { // 20 objetos × 10 puntos = 200 puntos
            showVictoryScreen();
        } else {
            // Continuar el juego
            generateGameObjects();
            selectNewTargetObject();
        }
    }, 800); // Duración de la animación aumentada
}

/**
 * Función para manejar respuesta incorrecta
 * @param {HTMLElement} objectElement - Elemento del objeto incorrecto
 */
function handleIncorrectAnswer(objectElement) {
    // Reproducir sonido de respuesta incorrecta
    const incorrectSound = new Audio('assets/audio/audio-oops (1).mp3');
    incorrectSound.play();
    
    // Añadir animación de respuesta incorrecta
    objectElement.classList.add('incorrect');
    
    // Quitar la animación después de que termine
    setTimeout(() => {
        objectElement.classList.remove('incorrect');
    }, 600);
}

/**
 * Función para seleccionar un nuevo objeto objetivo
 */
function selectNewTargetObject() {
    if (remainingObjects.length > 0) {
        currentTargetObject = getRandomElement(remainingObjects);
        updateAudioButtonState('new'); // Resetear estado del botón
    }
}

/**
 * Función para mostrar la pantalla de victoria
 */
function showVictoryScreen() {
    finalScoreDisplay.textContent = currentScore;
    
    // Crear gran efecto de celebración para la victoria
    setTimeout(() => {
        for (let i = 0; i < 30; i++) {
            setTimeout(() => {
                createCelebrationEffect();
            }, i * 200);
        }
    }, 500);
    
    changeScreen(gameScreen, victoryScreen);
}

/**
 * Función para reiniciar el juego
 */
function resetGame() {
    currentScore = 0;
    remainingObjects = [...gameObjects];
    currentTargetObject = null;
    isAudioPlaying = false;
    scoreDisplay.textContent = '0/200';
    updateAudioButtonState('new');
}

/**
 * Función para iniciar el juego principal
 */
function startMainGame() {
    resetGame();
    generateGameObjects();
    selectNewTargetObject();
    changeScreen(startScreen, gameScreen);
}

// =============================================================================
// EVENTOS Y INICIALIZACIÓN
// =============================================================================

/**
 * Función para inicializar la aplicación cuando se carga la página
 */
function initializeGame() {
    console.log('🎮 Juego de hebreo inicializado');
    
    // Evento para el botón de inicio
    startButton.addEventListener('click', () => {
        console.log('▶️ Iniciando juego...');
        
        // Cambiar estado del botón a "reproduciendo"
        updateStartButtonState('playing');
        
        // Reproducir audio de introducción con animación
        playAudioWithAnimation('assets/audio/intro.mp3', marianaStart, () => {
            console.log('🎵 Audio de introducción completado');
            updateStartButtonState('start'); // Volver al estado normal
            startMainGame();
        });
    });
    
    // Evento para el botón de reproducir audio
    playAudioButton.addEventListener('click', () => {
        const currentState = playAudioButton.dataset.state;
        
        if (currentState === 'playing') {
            // No hacer nada si está reproduciendo
            return;
        }
        
        if (currentTargetObject) {
            console.log(`🔊 Reproduciendo audio para: ${currentTargetObject}`);
            playObjectAudio(currentTargetObject);
        }
    });
    
    // Evento para el botón de jugar otra vez
    playAgainButton.addEventListener('click', () => {
        console.log('🔄 Reiniciando juego...');
        changeScreen(victoryScreen, startScreen);
    });
}

// Inicializar el juego cuando se carga la página
document.addEventListener('DOMContentLoaded', initializeGame);

// =============================================================================
// MANEJO DE ERRORES
// =============================================================================

/**
 * Función para manejar errores de audio
 */
function handleAudioError(audioPath, errorMsg) {
    console.error(`❌ Error cargando audio ${audioPath}: ${errorMsg}`);
    // Podrías mostrar un mensaje al usuario o usar un audio alternativo
}

// Agregar manejo de errores a los audios
window.addEventListener('error', (e) => {
    if (e.target.tagName === 'AUDIO') {
        handleAudioError(e.target.src, e.message);
    }
}, true);

// =============================================================================
// INFORMACIÓN DE DESARROLLO
// =============================================================================

console.log(`
🎮 JUEGO DE HEBREO CON OBJETOS 🎮
================================
📚 Objetos disponibles: ${gameObjects.length}
🎯 Puntuación máxima: 200 puntos
🎵 Archivos de audio: intro.mp3, audio-correct (1).mp3, audio-oops (1).mp3 + 20 objetos
🖼️ Archivos de imagen: mariana_boca_abierta.png, mariana_boca_cerrada.png + 20 objetos
================================
Desarrollado para niños de 4-5 años aprendiendo hebreo con niqqud
`);
