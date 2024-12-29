import type { BoardInterface, Land, LandEntry, Type, Unit } from './types';
import * as Lands from './lands';
import * as Cards from './cards';

export function uniqueId() {
	return Math.random().toString(36).slice(2);
}

type BoardEvents = {
	unitMove: (
		unit: Unit,
		position: { x: number; y: number },
		oldPosition: { x: number; y: number }
	) => void;
	unitSpawn: (unit: Unit) => void;
	unitDelete: (unit: Unit) => void;
	turnEnd: () => void;
	resourceUpdate: (type: Type, amount: number) => void;
	phaseChange: (phase: 'Draw' | 'Main' | 'Combat' | 'End') => void;
	drawCard: () => void;
	turnStart: () => void;
	landUpdate: (lands: LandEntry[]) => void;
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

	setDeck(deck: any[]) {
		this.deck = deck;
	}

	on(event: keyof BoardEvents, callback: BoardEvents[keyof BoardEvents]): void {
		// @ts-ignore
		this.addEventListener(event, (e: CustomEvent) => {
			// Extract the details and pass them directly to the callback

			// @ts-ignore
			callback(...e.detail);
		});
	}

	emit(event: keyof BoardEvents, ...args: Parameters<BoardEvents[keyof BoardEvents]>): void {
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

	advancePhase(): void {
		const phases: ('Draw' | 'Main' | 'Combat' | 'End')[] = ['Draw', 'Main', 'Combat', 'End'];
		const currentIndex = phases.indexOf(this.currentPhase);

		// Move to next phase, or back to Draw if we're at the end
		this.currentPhase = phases[(currentIndex + 1) % phases.length];

		// If we're back to Draw, it's a new turn
		if (this.currentPhase === 'Draw') {
			this.currentTurn++;
			this.emit('turnStart');

			this.units.forEach((unit) => {
				unit.emit('turnStart');
			});
			// Draw a card at the start of Draw phase
			this.drawCard();
		}

		// Emit the phase change event
		this.emit('phaseChange', this.currentPhase);

		// Handle phase-specific logic
		switch (this.currentPhase) {
			case 'Draw':
				// Already handled above
				break;
			case 'Main':
				// Reset movement/action flags for units
				this.units.forEach((unit) => {
					unit.hasMoved = false;
					unit.hasAttacked = false;
				});
				break;
			case 'Combat':
				// Prepare units for combat
				break;
			case 'End':
				// Clean up phase
				this.emit('turnEnd');
				break;
		}
	}

	drawCard(): void {
		if (this.deck.length === 0) {
			console.warn('No cards left in deck!');
			return;
		}

		const drawnCard = this.deck.pop();
		console.log('Drawn card:', drawnCard);
		if (drawnCard) {
			drawnCard.uniqueId = uniqueId();
			this.hand.push(drawnCard);
			this.emit('drawCard', drawnCard);
		}
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
		return pos.x >= 0 && pos.x < 8 && pos.y >= 0 && pos.y < 8;
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
		return this.units.find((unit) => unit.pos?.x === pos.x && unit.pos?.y === pos.y);
	}

	canMoveTo(unit: Unit, targetPos: { x: number; y: number }): boolean {
		if (!unit.pos || !this.isValidPosition(targetPos)) return false;

		// Calculate distance using adjusted positions
		const distance = this.calculateDistance(unit.pos, targetPos);

		// Check if movement is within unit's movement range
		if (distance > unit.stats.movement) return false;

		// Check if target position is occupied
		const occupyingUnit = this.getUnitAt(targetPos);
		if (occupyingUnit) {
			// Can't move to a space occupied by any unit (ally or enemy)
			return false;
		}

		return true;
	}

	canAttack(unit: Unit, targetPos: { x: number; y: number }): boolean {
		if (!unit.pos || !this.isValidPosition(targetPos)) return false;

		// Calculate distance
		const distance = this.calculateDistance(unit.pos, targetPos);

		const targetUnit = this.getUnitAt(targetPos);
		if (!targetUnit) return false;

		// Can only attack enemy units
		if (targetUnit.team === unit.team) return false;

		// Check if target is within attack range
		return distance <= unit.stats.range;
	}

	// Move unit to new position
	// Modify the moveUnit method to prevent recursive calls
	moveUnit(unit: Unit, newPos: { x: number; y: number }): boolean {
		if (!this.canMoveTo(unit, newPos)) return false;

		// Store old position for land exit effects
		const oldPos = unit.pos;

		// Update unit position
		unit.pos = newPos;

		// Emit move event
		this.emit('unitMove', unit, newPos, oldPos!);
		unit.emit('move', newPos, oldPos!);

		// Handle old land exit effects if needed
		const oldLandEntry = this.lands.find((l) => l.pos.x === oldPos?.x && l.pos.y === oldPos?.y);
		if (oldLandEntry) {
			oldLandEntry.land.emit('unitExit', unit);
		}

		// Handle new land entry effects
		const newLandEntry = this.lands.find((l) => l.pos.x === newPos.x && l.pos.y === newPos.y);
		if (newLandEntry) {
			setTimeout(() => {
				newLandEntry.land.emit('unitEnter', unit);
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

		unit.pos = position;
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

		for (let x = 0; x < 8; x++) {
			for (let y = 0; y < 8; y++) {
				let randomLand = landTypes[Math.floor(Math.random() * landTypes.length)];
				randomLand.position = {
					x,
					y
				};

				this.lands.push({ pos: { x, y }, land: randomLand });
			}
		}
	}

	playLand(land: Land<any>, position: { x: number; y: number }): boolean {
		const targetEntry = this.lands.find(
			(entry) => entry.pos.x === position.x && entry.pos.y === position.y
		);

		if (!targetEntry) {
			console.warn('Invalid position for land placement');
			return false;
		}

		// Update the land in the list
		this.lands = this.lands.map((entry) => {
			if (entry.pos.x === position.x && entry.pos.y === position.y) {
				return { pos: entry.pos, land };
			}
			return entry;
		});

		// Emit land update event
		this.emit('landUpdate', this.lands);
		return true;
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

		this.on('landUpdate', () => {
			this.lands.forEach((entry) => {
				entry.land.on('destroy', () => {
					this.lands = this.lands.filter((l) => l.pos.x !== entry.pos.x || l.pos.y !== entry.pos.y);
					this.lands.push({ pos: entry.pos, land: Lands.Steppes });
					this.emit('landUpdate', this.lands);
				});
			});
		});

		this.lands.forEach((entry) => {
			entry.land.on('destroy', () => {
				this.lands = this.lands.filter((l) => l.pos.x !== entry.pos.x || l.pos.y !== entry.pos.y);

				// Replace by Steppes

				this.lands.push({ pos: entry.pos, land: Lands.Steppes });
				this.emit('landUpdate', this.lands);
			});
		});
	}
}
