// Ensure inputs cannot be negative
document.querySelectorAll('input[type="number"]').forEach(input => {
    input.addEventListener('input', () => {
      if (input.value < 0) {
        input.value = 0;
      }
    });
  });
  
  document.getElementById('calculateButton').addEventListener('click', function() {
    const distance = parseFloat(document.getElementById('distance').value);
    const distanceUnit = document.getElementById('distanceUnit').value;
    const duration = parseFloat(document.getElementById('duration').value);
    const calories = parseFloat(document.getElementById('calories').value);
    let intensity = document.getElementById('intensity').value || 'moderate';
  
    const intensityFactors = {
      light: {
        stepRatePerMinute: 100,
        stepConversionFactorKm: 1000,
        stepConversionFactorMile: 1600,
        weights: { distance: 0.6, duration: 0.3, calories: 0.1 },
      },
      moderate: {
        stepRatePerMinute: 125,
        stepConversionFactorKm: 1250,
        stepConversionFactorMile: 2000,
        weights: { distance: 0.5, duration: 0.3, calories: 0.2 },
      },
      intense: {
        stepRatePerMinute: 150,
        stepConversionFactorKm: 1500,
        stepConversionFactorMile: 2400,
        weights: { distance: 0.4, duration: 0.4, calories: 0.2 },
      },
    };
  
    const userWeightFactor = 0.04; // kcal per step, assuming average weight
    const selectedIntensity = intensityFactors[intensity];
  
    const resultContainer = document.getElementById('resultContainer');
    const resultMessage = document.getElementById('resultMessage');
    resultContainer.style.display = 'none';
    resultMessage.className = '';
  
    // ------------------------------------------------------------------------------------
    // 1. Basic Validation: At least one input must be > 0
    // ------------------------------------------------------------------------------------
    if (
      (isNaN(distance) || distance <= 0) &&
      (isNaN(duration) || duration <= 0) &&
      (isNaN(calories) || calories <= 0)
    ) {
      resultContainer.style.display = 'block';
      resultMessage.className = 'alert alert-danger';
      resultMessage.textContent =
        'Please enter at least one positive value for distance, duration, or calories.';
      return;
    }
  
    // ------------------------------------------------------------------------------------
    // 2. Reasonableness Checks (Customize thresholds to your preference)
    //    - Example thresholds:
    //      a) If distance & duration provided, check speed (km/h).
    //      b) If distance & calories provided, check min. calories per km.
    //      c) If duration & calories provided, check min. calorie burn rate.
    // ------------------------------------------------------------------------------------
    const errors = [];
  
    // 2a) Speed check if both distance & duration are provided.
    //     Example: > 60 km/h might be considered too high for normal cycling.
    if (!isNaN(distance) && distance > 0 && !isNaN(duration) && duration > 0) {
      const hours = duration / 60;          // convert minutes to hours
      const speed = distance / hours;       // km / h
      if (speed > 60) {
        errors.push(
          `A speed of ~${speed.toFixed(1)} km/h seems unusually high. Check your distance or duration.`
        );
      }
    }
  
    // 2b) Calorie check if both distance & calories are provided.
    //     Example: Minimum 15-20 calories per km is realistic for casual cycling.
    if (!isNaN(distance) && distance > 0 && !isNaN(calories) && calories > 0) {
      // Let’s pick 15 cals/km as a rough “too low” threshold:
      //  10 km => at least 150 cals
      if (calories < distance * 15) {
        errors.push(
          `For ${distance} km, only ${calories} calories seems too low.`
        );
      }
    }
  
    // 2c) Basic check if both duration & calories are provided.
    //     Example: If someone cycles for 60 minutes, burning only 10 calories is definitely too low.
    if (!isNaN(duration) && duration > 0 && !isNaN(calories) && calories > 0) {
      // Let’s pick a "too low" threshold of ~2 calories per minute as a baseline (very minimal).
      //  60 minutes => at least 120 cals
      if (calories < duration * 2) {
        errors.push(
          `Burning only ${calories} calories in ${duration} minute(s) seems too low.`
        );
      }
    }
  
    // If we collected any errors, show them and stop calculation.
    if (errors.length > 0) {
      resultContainer.style.display = 'block';
      resultMessage.className = 'alert alert-danger';
      resultMessage.innerHTML =
        '<strong>Check your inputs:</strong><br>' + errors.join('<br>');
      return;
    }
  
    // ------------------------------------------------------------------------------------
    // 3. Proceed with Calculation if all checks are passed
    // ------------------------------------------------------------------------------------
    let steps = 0;
    let primaryContributor = '';
  
    // Direct calculation if exactly one valid input is provided
    if (
      !isNaN(distance) &&
      distance > 0 &&
      (isNaN(duration) || duration <= 0) &&
      (isNaN(calories) || calories <= 0)
    ) {
      const conversionFactor =
        distanceUnit === 'km'
          ? selectedIntensity.stepConversionFactorKm
          : selectedIntensity.stepConversionFactorMile;
      steps = distance * conversionFactor;
      primaryContributor = 'Distance';
    } else if (
      !isNaN(duration) &&
      duration > 0 &&
      (isNaN(distance) || distance <= 0) &&
      (isNaN(calories) || calories <= 0)
    ) {
      steps = duration * selectedIntensity.stepRatePerMinute;
      primaryContributor = 'Duration';
    } else if (
      !isNaN(calories) &&
      calories > 0 &&
      (isNaN(distance) || distance <= 0) &&
      (isNaN(duration) || duration <= 0)
    ) {
      steps = calories / userWeightFactor;
      primaryContributor = 'Calories';
    } else {
      // Weighted average calculation for multiple inputs
      let stepsFromDistance = 0;
      let stepsFromDuration = 0;
      let stepsFromCalories = 0;
  
      if (!isNaN(distance) && distance > 0) {
        const conversionFactor =
          distanceUnit === 'km'
            ? selectedIntensity.stepConversionFactorKm
            : selectedIntensity.stepConversionFactorMile;
        stepsFromDistance = distance * conversionFactor;
      }
      if (!isNaN(duration) && duration > 0) {
        stepsFromDuration = duration * selectedIntensity.stepRatePerMinute;
      }
      if (!isNaN(calories) && calories > 0) {
        stepsFromCalories = calories / userWeightFactor;
      }
  
      const weights = selectedIntensity.weights;
      const totalWeight = weights.distance + weights.duration + weights.calories;
      steps =
        (weights.distance * stepsFromDistance +
          weights.duration * stepsFromDuration +
          weights.calories * stepsFromCalories) /
        totalWeight;
  
      // Determine primary contributor
      if (
        stepsFromDistance >= stepsFromDuration &&
        stepsFromDistance >= stepsFromCalories
      ) {
        primaryContributor = 'Distance';
      } else if (
        stepsFromDuration >= stepsFromDistance &&
        stepsFromDuration >= stepsFromCalories
      ) {
        primaryContributor = 'Duration';
      } else {
        primaryContributor = 'Calories';
      }
    }
  
    // Normalize results to avoid large discrepancies
    steps = Math.max(steps, 10); // Ensure a minimum of 10 steps
  
    // Display result
    resultContainer.style.display = 'block';
    resultMessage.className = 'alert alert-success';
    resultMessage.textContent = `Estimated Steps: ${Math.round(steps).toLocaleString()}`;
  });
  