export const calculateBMI = (weight: number, height: number) => {
  if (height <= 0) return 0;
  const heightInMeters = height / 100;
  return Number((weight / (heightInMeters * heightInMeters)).toFixed(1));
};

export const calculateBMR = (weight: number, height: number, age: number, gender: 'male' | 'female') => {
  if (gender === 'male') {
    return Number((10 * weight + 6.25 * height - 5 * age + 5).toFixed(0));
  }
  return Number((10 * weight + 6.25 * height - 5 * age - 161).toFixed(0));
};

export const calculateTDEE = (bmr: number, activityLevel: number) => {
  return Number((bmr * activityLevel).toFixed(0));
};

export const getBMICategory = (bmi: number) => {
  if (bmi < 18.5) return 'Niedowaga';
  if (bmi < 25) return 'Norma';
  if (bmi < 30) return 'Nadwaga';
  return 'Otyłość';
};
