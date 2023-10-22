import {describe} from "mocha";
import chaiAsPromised from "chai-as-promised";
import {JapaneseRound, Wind} from "../../src/controller/MahjongRound";
import {expect, use} from "chai";

use(chaiAsPromised);

describe("A mahjong round should be set up correctly", () => {
	it("should set up correctly", () => {
		const round1 = new JapaneseRound(
			[
				{playerName: "A", score: 25000},
				{playerName: "B", score: 25000},
				{playerName: "C", score: 25000},
				{playerName: "D", score: 25000},
			],
			Wind.EAST,
			1,
			0,
			0
		);
		expect(round1.getPlayerLocalIndex("A")).equal(0);
		const round2 = new JapaneseRound(
			[
				{playerName: "A", score: 25000},
				{playerName: "B", score: 25000},
				{playerName: "C", score: 25000},
				{playerName: "D", score: 25000},
			],
			Wind.EAST,
			2,
			0,
			0
		);
		expect(round2.getPlayerLocalIndex("A")).equal(3);
		expect(round2.getPlayerLocalIndex("B")).equal(0);
		const round4 = new JapaneseRound(
			[
				{playerName: "A", score: 25000},
				{playerName: "B", score: 25000},
				{playerName: "C", score: 25000},
				{playerName: "D", score: 25000},
			],
			Wind.EAST,
			4,
			0,
			0
		);
		expect(round4.getPlayerLocalIndex("A")).equal(1);
		expect(round4.getPlayerLocalIndex("B")).equal(2);
	});
	it("should calculate ron correctly", () => {
		const round1 = new JapaneseRound(
			[
				{playerName: "A", score: 25000},
				{playerName: "B", score: 25000},
				{playerName: "C", score: 25000},
				{playerName: "D", score: 25000},
			],
			Wind.EAST,
			2,
			0,
			0
		);
		round1.addRon("B", "C", {
			fu: 30,
			han: 3,
			honba: 0,
		});
		const ronResult1 = round1.getScoreDeltas();
		expect(ronResult1).deep.equal([0, 5800, -5800, 0]);
		const round2 = new JapaneseRound(
			[
				{playerName: "A", score: 25000},
				{playerName: "B", score: 25000},
				{playerName: "C", score: 25000},
				{playerName: "D", score: 25000},
			],
			Wind.EAST,
			2,
			0,
			0
		);
		round2.addRon("A", "C", {
			fu: 60,
			han: 3,
			honba: 2,
		});
		round2.addRiichi("D");
		const ronResult2 = round2.getScoreDeltas();
		expect(ronResult2).deep.equal([8300, 0, -8300, 0]);
		const nextResult = round2.getNextRound();
		expect(nextResult.globalSeating).deep.equal([
			{playerName: "A", score: 34300},
			{playerName: "B", score: 25000},
			{playerName: "C", score: 16700},
			{playerName: "D", score: 24000},
		]);
		expect(nextResult.riichiSticks).equal(0);
	});
	it("should calculate tsumo correctly", () => {
		const round1 = new JapaneseRound(
			[
				{playerName: "A", score: 25000},
				{playerName: "B", score: 25000},
				{playerName: "C", score: 25000},
				{playerName: "D", score: 25000},
			],
			Wind.EAST,
			2,
			0,
			0
		);
		round1.addTsumo("B", {
			fu: 30,
			han: 4,
			honba: 0,
		});
		const tsumoResult1 = round1.getScoreDeltas();
		expect(tsumoResult1).deep.equal([-3900, 11700, -3900, -3900]);
		const round2 = new JapaneseRound(
			[
				{playerName: "A", score: 25000},
				{playerName: "B", score: 25000},
				{playerName: "C", score: 25000},
				{playerName: "D", score: 25000},
			],
			Wind.EAST,
			2,
			0,
			0
		);
		round2.addTsumo("A", {
			fu: 40,
			han: 3,
			honba: 2,
		});
		const tsumoResult2 = round2.getScoreDeltas();
		expect(tsumoResult2).deep.equal([5800, -2800, -1500, -1500]);
	});
});
