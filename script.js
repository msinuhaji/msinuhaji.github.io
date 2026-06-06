const engine = Matter.Engine.create();
const render = Matter.Render.create({
    element: document.getElementById('playground'),
    engine: engine,
    options: {
        width: window.innerWidth,
        height: window.innerHeight,
        wireframes: false,
        background: 'transparent'
    }
});
const runner = Matter.Runner.create();
let updateFunctions = [];

let borders = [Matter.Bodies.rectangle(
    window.innerWidth / 2, //x centre
    window.innerHeight + 50, //y centre
    window.innerWidth, //width
    100, //height
    { isStatic: true, restitution: 1, friction: 1, frictionStatic: 1 }
),
Matter.Bodies.rectangle(
    window.innerWidth + 50, //x centre
    window.innerHeight / 2, //y centre
    100, //width
    window.innerHeight * 100, //height
    { isStatic: true, restitution: 1, friction: 1, frictionStatic: 1 }
),
Matter.Bodies.rectangle(
    -50, //x centre
    window.innerHeight / 2, //y centre
    100, //width
    window.innerHeight * 100, //height
    { isStatic: true, restitution: 1, friction: 0, frictionStatic: 0 }
)];
let objects = [];
Matter.World.add(engine.world, borders);

class AssignElementToBody {
    constructor(element, data) {
        const rect = element.getBoundingClientRect();
        this.size = [rect.width, rect.height];

        // this.size = [
        //     element.style.height, //300 + (Math.random() - 0.5) / 0.5 * 0.03 * window.innerWidth, //width
        //     element.style.width //200 + (Math.random() - 0.5) / 0.5 * 0.04 * window.innerHeight, //height
        // ]

        this.element = element;
        if (data.shape == 'ball') {
            this.body = Matter.Bodies.ball(
                window.innerWidth / 2 + (Math.random() - 0.5) / 0.5 * window.innerWidth / 2, //x
                - (Math.random() * 100 + 40), //y
                this.size[0],
                this.size[1],
                {
                    restitution: 0.4,
                    frictionAir: 0.005,
                    friction: 0.94,
                    frictionStatic: 0.6,
                    density: 0.001,
                    render: {
                        fillStyle: "transparent",
                        strokeStyle: "transparent"
                    }
                },
            );
        } else {
            this.body = Matter.Bodies.rectangle(
                window.innerWidth / 2 + (Math.random() - 0.5) / 0.5 * window.innerWidth / 2, //x
                - (Math.random() * 100 + 40), //y
                this.size[0],
                this.size[1],
                {
                    restitution: 0.4,
                    frictionAir: 0.005,
                    friction: 0.94,
                    frictionStatic: 0.6,
                    density: 0.001,
                    render: {
                        fillStyle: "transparent",
                        strokeStyle: "transparent"
                    }
                },
            );
        }

        this.element.style.height = `${this.size[1]}px`;
        this.element.style.width = `${this.size[0]}px`;

        Matter.World.add(engine.world, this.body);
        Matter.Body.setAngularVelocity(this.body, (Math.random() - 0.5) / 0.05 * 0.001);
        Matter.Body.setVelocity(this.body, { x: (Math.random() - 0.5) * 10, y: (Math.random() - 0.5) * 10 });
        updateFunctions.push(() => this.update());
    }

    update() {
        if (this.element && this.size) {
            this.element.style.transform = `translate(${this.body.position.x - this.size[0] / 2}px, ${this.body.position.y - this.size[1] / 2}px) rotate(${this.body.angle * 180 / Math.PI}deg)`;
        } else {
            console.warn("No DOM element found, cannot update!");
        };
    }
}

Matter.Render.run(render);
Matter.Runner.run(runner, engine);

// Convert HTMLCollection to array and create physics body for each element
const physicalElements = Array.from(document.getElementsByClassName('physical'));
physicalElements.forEach(element => {
    objects.push(new AssignElementToBody(element, {}));
});

Matter.Events.on(engine, 'beforeUpdate', () => {
    for (let i = 0; i < updateFunctions.length; i++) {
        updateFunctions[i]();
    }
});



