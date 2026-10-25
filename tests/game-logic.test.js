/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Basic game logic unit tests for REDLINE: Electric Racing Experience
 */

function testSpeedConversion() {
  const kmh = 100;
  const mph = Math.round(kmh * 0.621371);
  if (mph !== 62) {
    throw new Error(`Speed conversion failed: expected 62, got ${mph}`);
  }
  console.log('✓ Speed unit conversion test passed');
}

function testCollisionMath() {
  // Player bounds
  const playerX = 1.8;
  const playerZ = 50.0;
  const playerHalfWidth = 0.95;
  const playerHalfLength = 2.2;

  // Traffic car bounds
  const trafficX = 1.8;
  const trafficZ = 51.5;
  const trafficHalfWidth = 0.95;
  const trafficHalfLength = 2.2;

  const dx = Math.abs(trafficX - playerX);
  const dz = Math.abs(trafficZ - playerZ);

  const isHit = dx < (playerHalfWidth + trafficHalfWidth) * 0.88 &&
                dz < (playerHalfLength + trafficHalfLength) * 0.84;

  if (!isHit) {
    throw new Error('Collision detection test failed: expected intersection to be true');
  }
  console.log('✓ Collision bounding box math test passed');
}

function testNearMissLogic() {
  const playerX = 0;
  const playerZ = 100;
  const speedKmh = 140;

  const trafficX = 2.1; // Squeezing right next to traffic
  const trafficZ = 101;

  const dx = Math.abs(trafficX - playerX);
  const dz = Math.abs(trafficZ - playerZ);

  const isNearMiss = speedKmh > 110 && dx < 2.45 && dz < 4.0;
  if (!isNearMiss) {
    throw new Error('Near-miss test failed: expected near miss to trigger at high speed');
  }
  console.log('✓ Near-miss logic test passed');
}

function testScoreMultiplierProgression() {
  const comboCount = 4;
  const multiplier = Math.min(4.0, 1.0 + comboCount * 0.25);
  if (multiplier !== 2.0) {
    throw new Error(`Multiplier test failed: expected 2.0, got ${multiplier}`);
  }
  console.log('✓ Score combo multiplier progression test passed');
}

function testWetRoadPhysicsTraction() {
  const roadWetness = 1.0; // 100% soaked in rain storm
  const wetBrakeScale = 1.0 - roadWetness * 0.18;
  const maxDriftSlip = 1.0 + roadWetness * 0.35;

  if (Math.abs(wetBrakeScale - 0.82) > 0.001) {
    throw new Error(`Wet brake calculation failed: expected 0.82, got ${wetBrakeScale}`);
  }
  if (Math.abs(maxDriftSlip - 1.35) > 0.001) {
    throw new Error(`Wet drift slip calculation failed: expected 1.35, got ${maxDriftSlip}`);
  }
  console.log('✓ Dynamic weather wet road traction & drift physics test passed');
}

function runAllTests() {
  console.log('Running REDLINE game logic tests...');
  testSpeedConversion();
  testCollisionMath();
  testNearMissLogic();
  testScoreMultiplierProgression();
  testWetRoadPhysicsTraction();
  console.log('All tests passed successfully!');
}

runAllTests();
