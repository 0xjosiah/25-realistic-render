import './style.css'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import * as dat from 'lil-gui'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'

/**
 * Loaders
 */
const gltfLoader = new GLTFLoader()
const cubeTextureLoader = new THREE.CubeTextureLoader()


/**
 * Base
 */
// Debug
const gui = new dat.GUI()
const debugObj = {}

// Canvas
const canvas = document.querySelector('canvas.webgl')

// Scene
const scene = new THREE.Scene()

/**
 * Update all materials
 */
const updateAllMaterials = () => {
    scene.traverse((child) => {
        if(child instanceof THREE.Mesh && child.material instanceof THREE.MeshStandardMaterial) {
            // child.material.envMap = envMap //easier way is down below scene.environment
            child.material.envMapIntensity = debugObj.envMapIntensity
            child.material.needsUpdate = true
            child.castShadow = true
            child.receiveShadow = true
        }
    })
}

/**
 * Env map
 */
const envMap = cubeTextureLoader.load([
    '/textures/environmentMaps/0/px.jpg',
    '/textures/environmentMaps/0/nx.jpg',
    '/textures/environmentMaps/0/py.jpg',
    '/textures/environmentMaps/0/ny.jpg',
    '/textures/environmentMaps/0/pz.jpg',
    '/textures/environmentMaps/0/nz.jpg',
])
envMap.encoding = THREE.sRGBEncoding
scene.background = envMap
scene.environment = envMap // this easiest way to apply env map, the updateAllMaterials is useful for adding gui param

debugObj.envMapIntensity = 3
gui.add(debugObj, 'envMapIntensity', 0, 10, .05).onChange(updateAllMaterials)

/**
 * Models
 */
gltfLoader.load(
    // '/models/FlightHelmet/glTF/FlightHelmet.gltf',
    '/models/hamburger.glb',
    (glTF) => {
        console.log(glTF, 'success');
        glTF.scene.scale.set(.3,.3,.3)
        glTF.scene.position.set(0,-1,0)
        glTF.scene.rotation.y = Math.PI * .5
        scene.add(glTF.scene)

        gui.add(glTF.scene.rotation, 'y', -Math.PI, Math.PI, .001).name('rotation')

        updateAllMaterials()
    }
)

/**
 * Lights
 */
const directionalLight = new THREE.DirectionalLight(0xffffff, 3)
directionalLight.position.set(.25, 3, -2.25)
directionalLight.castShadow = true
directionalLight.shadow.camera.far = 15
directionalLight.shadow.mapSize.set(1024, 1024)
directionalLight.shadow.normalBias = .05 // this helps fix 'shadow acne'; obj doesn't create shadow on itself; use bias (not normal bias) for flat obj
scene.add(directionalLight)

// const directionalLightCamHelp = new THREE.CameraHelper(directionalLight.shadow.camera)
// scene.add(directionalLightCamHelp)

gui.add(directionalLight, 'intensity', 0, 10, .001).name('light intensity')
gui.add(directionalLight.position, 'x', -5, 5, .001).name('light x')
gui.add(directionalLight.position, 'y', -5, 5, .001).name('light y')
gui.add(directionalLight.position, 'z', -5, 5, .001).name('light z')

/**
 * Sizes
 */
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}

window.addEventListener('resize', () =>
{
    // Update sizes
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight

    // Update camera
    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()

    // Update renderer
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
})

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 100)
camera.position.set(4, 1, - 4)
scene.add(camera)

// Controls
const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true,
})
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
renderer.physicallyCorrectLights = true
renderer.outputEncoding = THREE.sRGBEncoding //can also use gamma encoding; 
renderer.toneMapping = THREE.ReinhardToneMapping
renderer.toneMappingExposure = 3
renderer.shadowMap.enabled = true
renderer.shadowMap.type = THREE.PCFSoftShadowMap

gui.add(renderer, 'toneMappingExposure', 0, 10, .001)

gui.add(renderer, 'toneMapping', {
    no: THREE.NoToneMapping,
    linear: THREE.LinearToneMapping,
    reinhard: THREE.ReinhardToneMapping,
    cineon: THREE.CineonToneMapping,
    ACESFilmicToneMapping: THREE.ACESFilmicToneMapping
})

/**
 * Animate
 */
const tick = () =>
{
    // Update controls
    controls.update()

    // Render
    renderer.render(scene, camera)

    // Call tick again on the next frame
    window.requestAnimationFrame(tick)
}

tick()