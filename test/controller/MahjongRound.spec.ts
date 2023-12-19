import {describe} from "mocha";
import chaiAsPromised from "chai-as-promised";
import {expect, use} from "chai";
import {ActionType, Wind} from "../../src/controller/Types";
import {JapaneseRound} from "../../src/controller/MahjongRound";

use(chaiAsPromised);

describe("should calculate points correctly", () => {
	it("should handle normal deal in 30fu 1han 0 -> 2", () => {
		const round = new JapaneseRound({
			roundWind: Wind.EAST,
			roundNumber: 1,
			honba: 0,
			startingRiichiSticks: 0,
		});
		const hand = {fu: 30, han: 1};
		round.addRon(2, 0, hand);
		expect(round.concludeGame()).deep.equal({
			roundWind: Wind.EAST,
			roundNumber: 1,
			honba: 0,
			startingRiichiSticks: 0,
			riichis: [],
			endingRiichiSticks: 0,
			transactions: [
				{
					actionType: ActionType.RON,
					hand: hand,
					scoreDeltas: [-1000, 0, 1000, 0],
				},
			],
		});
	});
	it("should handle deal in 30fu 2han 1 -> 0, 0, 1 riichi", () => {
		const round = new JapaneseRound({
			roundWind: Wind.EAST,
			roundNumber: 2,
			honba: 3,
			startingRiichiSticks: 0,
		});
		const hand = {fu: 30, han: 2};
		round.addRon(0, 1, hand);
		round.addRiichi(0);
		round.addRiichi(1);
		expect(round.concludeGame()).deep.equal({
			roundWind: Wind.EAST,
			roundNumber: 2,
			honba: 3,
			startingRiichiSticks: 0,
			riichis: [0, 1],
			endingRiichiSticks: 0,
			transactions: [
				{
					actionType: ActionType.RON,
					hand: hand,
					scoreDeltas: [2900, -2900, 0, 0],
				},
			],
		});
	});
	it("should handle double ron", () => {
		const round = new JapaneseRound({
			roundWind: Wind.EAST,
			roundNumber: 3,
			honba: 0,
			startingRiichiSticks: 0,
		});
		const hand1 = {fu: 30, han: 5};
		round.addRon(0, 2, hand1);
		const hand2 = {fu: 30, han: 6};
		round.addRon(1, 2, hand2);
		expect(round.concludeGame()).deep.equal({
			roundWind: Wind.EAST,
			roundNumber: 3,
			honba: 0,
			startingRiichiSticks: 0,
			riichis: [],
			endingRiichiSticks: 0,
			transactions: [
				{
					actionType: ActionType.RON,
					scoreDeltas: [8000, 0, -8000, 0],
					hand: hand1
				},
				{
					actionType: ActionType.RON,
					scoreDeltas: [0, 12000, -12000, 0],
					hand: hand2
				}
			],
		});
	});
	it("should handle double ron with honba and riichi", () => {
		const round = new JapaneseRound({
			roundWind: Wind.EAST,
			roundNumber: 4,
			honba: 1,
			startingRiichiSticks: 0,
		});
		const hand1 = {fu: 30, han: 6};
		round.addRon(2, 3, hand1);
		const hand2 = {fu: 30, han: 2};
		round.addRon(1, 3, hand2);
		round.addRiichi(1);
		round.addRiichi(2);
		round.addRiichi(3);
		expect(round.concludeGame()).deep.equal({
			roundWind: Wind.EAST,
			roundNumber: 4,
			honba: 1,
			startingRiichiSticks: 0,
			riichis: [1, 2, 3],
			endingRiichiSticks: 0,
			transactions: [
				{
					actionType: ActionType.RON,
					scoreDeltas: [0, 0, 12000, -12000],
					hand: hand1
				},
				{
					actionType: ActionType.RON,
					scoreDeltas: [0, 2300, 0, -2300],
					hand: hand2
				}
			],
		});
	});
	it("should be order agnostic for double ron", () => {
		const round = new JapaneseRound({
			roundWind: Wind.EAST,
			roundNumber: 4,
			honba: 1,
			startingRiichiSticks: 0,
		});
		const hand2 = {fu: 30, han: 2};
		round.addRon(1, 3, hand2);
		const hand1 = {fu: 30, han: 6};
		round.addRon(2, 3, hand1);
		round.addRiichi(1);
		round.addRiichi(2);
		round.addRiichi(3);
		expect(round.concludeGame()).deep.equal({
			roundWind: Wind.EAST,
			roundNumber: 4,
			honba: 1,
			startingRiichiSticks: 0,
			riichis: [1, 2, 3],
			endingRiichiSticks: 0,
			transactions: [
				{
					actionType: ActionType.RON,
					scoreDeltas: [0, 2300, 0, -2300],
					hand: hand2
				},
				{
					actionType: ActionType.RON,
					scoreDeltas: [0, 0, 12000, -12000],
					hand: hand1
				}
			],
		});
	});
});
