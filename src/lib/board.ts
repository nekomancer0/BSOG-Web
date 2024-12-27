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

	on(event: string, callback: (...args: any[]) => void): void {
		// @ts-ignore
		this.addEventListener(event, (e: CustomEvent) => {
			// Extract the details and pass them directly to the callback
			callback(...e.detail);
		});
	}

	emit(event: string, ...args: any[]): void {
		this.dispatchEvent(
			new CustomEvent(event, {
				detail: args
			})
		);
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
	 * Removes a unit from the board and triggers the delete event.
	 * @param unit - The unit to remove from the board.
	 */
	deleteUnit(unit: Unit): void {
		this.units = this.units.filter((u) => u.id !== unit.id);
		this.emit('unitDelete', unit);
	}

	// Check if a position is within the board boundaries
	private isValidPosition(pos: { x: number; y: number }): boolean {
		return pos.x + 1 >= 0 && pos.x + 1 <= 8 && pos.y + 1 >= 0 && pos.y + 1 <= 8;
	}

	// Calculate Manhattan distance between two positions
	private calculateDistance(
		pos1: { x: number; y: number },
		pos2: { x: number; y: number }
	): number {
		return Math.abs(pos1.x - pos2.x) + Math.abs(pos1.y - pos2.y);
	}

	// Get unit at a specific position
	getUnitAt(pos: { x: number; y: number }): Unit | undefined {
		return this.units.find((unit) => unit.pos?.x === pos.x + 1 && unit.pos?.y === pos.y + 1);
	}

	// Check if a unit can move to a position
	canMoveTo(unit: Unit, targetPos: { x: number; y: number }): boolean {
		if (!unit.pos || !this.isValidPosition(targetPos)) return false;

		// Adjust positions for calculation
		const adjustedTarget = {
			x: targetPos.x + 1,
			y: targetPos.y + 1
		};

		// Calculate distance using adjusted positions
		const distance = this.calculateDistance(unit.pos, adjustedTarget);

		// Check if movement is within unit's movement range
		if (distance > unit.stats.movement) return false;

		// Check if target position is occupied
		const occupyingUnit = this.getUnitAt(targetPos);
		if (occupyingUnit) return false;

		return true;
	}

	// Check if a unit can attack a target position
	canAttack(unit: Unit, targetPos: { x: number; y: number }): boolean {
		if (!unit.pos || !this.isValidPosition(targetPos)) return false;

		// Calculate distance
		const distance = this.calculateDistance(unit.pos, targetPos);

		// Check if target is within attack range
		return distance <= unit.stats.range;
	}

	// Move unit to new position
	// Modify the moveUnit method to prevent recursive calls
	moveUnit(unit: Unit, newPos: { x: number; y: number }): boolean {
		if (!this.canMoveTo(unit, newPos)) return false;

		const adjustedPos = {
			x: newPos.x + 1,
			y: newPos.y + 1
		};

		// Store old position for animation purposes
		const oldPos = { ...unit.pos };

		// Update unit position
		unit.pos = adjustedPos;

		// Emit move event
		this.emit('unitMove', unit, adjustedPos);

		// Handle land effects
		const landEntry = this.lands.find(
			(l) => l.pos.x === adjustedPos.x && l.pos.y === adjustedPos.y
		);

		if (landEntry) {
			setTimeout(() => {
				landEntry.land.emit('unitEnter', unit);
			}, 0);
		}

		return true;
	}

	// Place unit on board
	placeUnit(unit: Unit, position: { x: number; y: number }): boolean {
		if (!this.isValidPosition(position) || this.getUnitAt(position)) {
			console.log('Invalid position or position occupied:', position);
			return false;
		}

		unit.pos = { ...position };
		this.units.push(unit);
		console.log('Unit placed:', unit, 'at position:', position);
		console.log('Current units on board:', this.units);

		this.emit('unitSpawn', unit);

		const landEntry = this.lands.find((l) => l.pos.x === position.x && l.pos.y === position.y);
		if (landEntry) {
			setTimeout(() => {
				landEntry.land.emit('unitEnter', unit);
			}, 0);
		}

		return true;
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

		for (let x = 1; x <= 8; x++) {
			for (let y = 1; y <= 8; y++) {
				let randomLand = landTypes[Math.floor(Math.random() * landTypes.length)];
				randomLand.position = {
					x,
					y
				};

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
					entry.land.emit('unitEnter', unit);
				}
			});
		});
	}
}
