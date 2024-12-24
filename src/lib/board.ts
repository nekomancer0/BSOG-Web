import type { BoardInterface, LandEntry, Type, Unit } from './types';
import * as Lands from './lands';
import * as Cards from './cards';

type BoardEvents = {
	unitMove: (unit: Unit, position: { x: number; y: number }) => void;
	unitSpawn: (unit: Unit) => void;
	unitDelete: (unit: Unit) => void;
	turnEnd: () => void;
	resourceUpdate: (type: Type, amount: number) => void;
	phaseChange: (phase: 'Draw' | 'Main' | 'Combat' | 'End') => void;
	drawCard: () => void;
	turnStart: () => void;
};

/**
 * Represents the game board, including units and lands.
 */
export class Board extends EventTarget implements BoardInterface {
	units: Unit[] = [];
	lands: LandEntry[] = [];
	currentTurn: number = 0;
	deck: any[] = [];
	currentPhase: 'Draw' | 'Main' | 'Combat' | 'End' = 'Draw';
	hand: any[] = [];
	resources = {
		elementalPower: {
			Primordial: 0,
			Erudite: 0,
			Sylvester: 0,
			Shadows: 0,
			Neutral: 0
		}
	};

	constructor() {
		super();
		this.initializeLands();
		this.setupEventListeners();
	}

	/**
	 * Registers an event listener for board events.
	 * @param event - The name of the event.
	 * @param listener - The event listener function.
	 */
	on(event: keyof BoardEvents, listener: BoardEvents[keyof BoardEvents]): void {
		this.addEventListener(event, (e: Event) => {
			const customEvent = e as CustomEvent<any[]>;

			// @ts-ignore
			listener(...customEvent.detail);
		});
	}

	/**
	 * Emits a board event.
	 * @param event - The name of the event.
	 * @param args - The event arguments.
	 */
	emit(event: keyof BoardEvents, ...args: Parameters<BoardEvents[keyof BoardEvents]>): void {
		this.dispatchEvent(new CustomEvent(event, { detail: args }));
	}

	gainResources(type: keyof typeof this.resources.elementalPower, amount: number) {
		this.resources.elementalPower[type] += amount;
		this.emit('resourceUpdate', type, this.resources.elementalPower[type]);
	}

	advancePhase() {
		const phases: ('Draw' | 'Main' | 'Combat' | 'End')[] = ['Draw', 'Main', 'Combat', 'End'];
		const currentIndex = phases.indexOf(this.currentPhase);

		// Move to next phase, or back to Draw if we're at the end
		const nextIndex = (currentIndex + 1) % phases.length;
		this.currentPhase = phases[nextIndex];

		// Emit the phase change event
		this.emit('phaseChange', this.currentPhase);

		// Handle phase-specific logic
		if (this.currentPhase === 'Draw') {
			// Start of new turn
			this.emit('turnStart');
			// Draw a card at the start of Draw phase
			this.emit('drawCard');
		}
	}

	drawCard() {
		this.hand.push(this.deck.pop());
		this.advancePhase();
	}

	/**
	 * Adds a new unit to the board and triggers the spawn event.
	 * @param unit - The unit to spawn on the board.
	 */
	spawnUnit(unit: Unit<'Companion' | 'Hero'>): void {
		this.units.push(unit);

		if (unit.isHero()) {
			this.updateHeroCard(unit);
		}

		this.emit('unitSpawn', unit);
	}

	/**
	 * Removes a unit from the board and triggers the delete event.
	 * @param unit - The unit to remove from the board.
	 */
	deleteUnit(unit: Unit): void {
		this.units = this.units.filter((u) => u.id !== unit.id);
		this.emit('unitDelete', unit);
	}

	/**
	 * Moves a unit to a new position and triggers the move event.
	 * @param unit - The unit to move.
	 * @param position - The new position of the unit.
	 */
	moveUnit(unit: Unit, position: { x: number; y: number }): void {
		// @ts-ignore
		this.units = this.units.map((u) => (u.id === unit.id ? { ...u, pos: position } : u));
		this.emit('unitMove', unit, position);
	}

	/**
	 * Ends the current turn and triggers the turn end event.
	 */
	endTurn(): void {
		this.currentTurn++;
		this.emit('turnEnd');

		// Example global effect: regenerate HP for all units
		this.units.forEach((unit) => {
			if (unit.stats.currentHp < unit.stats.hp) {
				unit.updateStats({
					currentHp: unit.stats.currentHp + 1
				});
			}
		});
	}

	/**
	 * Initializes the lands on the board.
	 */
	private initializeLands(): void {
		const landTypes = [Lands.Steppes]; // Exclusion des Traps et terrains spéciaux

		for (let x = 0; x < 8; x++) {
			for (let y = 0; y < 8; y++) {
				const randomLand = landTypes[Math.floor(Math.random() * landTypes.length)];
				this.lands.push({ pos: { x, y }, land: randomLand });
			}
		}
	}

	/**
	 * Permet à un joueur de jouer une carte terrain spécifique.
	 * @param land - La carte terrain à placer.
	 * @param position - La position où placer le terrain.
	 */
	playLand(
		land: (typeof Lands)[keyof typeof Lands],
		position: { x: number; y: number }
	): typeof this.lands | void {
		const targetEntry = this.lands.find(
			(entry) => entry.pos.x === position.x && entry.pos.y === position.y
		);

		if (!targetEntry) {
			console.warn('Position invalide pour jouer ce terrain.');
			return;
		}

		// Placer le nouveau terrain
		// Mettre à jour le terrain dans la liste
		this.lands = this.lands.map((entry) => {
			if (entry.pos.x === position.x && entry.pos.y === position.y) {
				return { ...entry, land };
			}
			return entry;
		});

		// Mettre à jour le terrain sur le plateau
		targetEntry.land = land;

		if (land.id === '1') {
			console.log('Un piège a été placé !');
			land.once('trigger', () => {
				// Suppression du piège après son effet
				this.lands = this.lands.filter(
					(entry) => entry.pos.x !== position.x || entry.pos.y !== position.y
				);
				console.log('Le piège a été déclenché et supprimé.');
			});
		}

		return this.lands;
	}

	/**
	 * Sets up event listeners for board events.
	 */
	private setupEventListeners(): void {
		this.on('unitMove', (unit: any, position: { x: number; y: number }) => {
			this.lands.forEach((entry) => {
				if (entry.pos.x === position.x && entry.pos.y === position.y) {
					entry.land.emit('unitOn', unit);
				}
			});
		});
	}

	/**
	 * Updates the hero card display when a hero unit is spawned.
	 * @param unit - The hero unit to display.
	 */
	private updateHeroCard(unit: Unit<'Hero'>): void {
		const heroCardEl = document.querySelector<HTMLImageElement>('.hero-card');
		if (!heroCardEl) return;

		const img = new Image();
		img.src = unit.image;

		img.onload = () => {
			heroCardEl.width = img.width / 3;
			heroCardEl.height = img.height / 3;
			heroCardEl.src = img.src;

			heroCardEl.addEventListener('click', () => {
				this.showPreview(unit.image);
			});
		};
	}

	/**
	 * Displays a preview of the given image.
	 * @param imageSrc - The source URL of the image to preview.
	 */
	private showPreview(imageSrc: string): void {
		const previewDiv = document.querySelector<HTMLDivElement>('.preview');
		if (!previewDiv) return;

		const img = document.createElement('img');
		img.src = imageSrc;
		previewDiv.innerHTML = '';
		previewDiv.appendChild(img);

		const clearPreview = () => {
			previewDiv.innerHTML = '';
			previewDiv.removeEventListener('click', clearPreview);
		};

		previewDiv.addEventListener('click', clearPreview);
	}
}
