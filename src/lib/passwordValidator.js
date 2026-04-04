export const validatePassword = (password) => {
  if (!password) {
    return {
      isValid: false,
      errors: ["Le mot de passe est requis"]
    };
  }

  const errors = [];
  if (password.length < 8) errors.push("Au moins 8 caractères");
  if (!/[A-Z]/.test(password)) errors.push("Au moins une majuscule");
  if (!/[a-z]/.test(password)) errors.push("Au moins une minuscule");
  if (!/\d/.test(password)) errors.push("Au moins un chiffre");
  if (!/[!@#$%^&*]/.test(password)) errors.push("Au moins un caractère spécial (!@#$%^&*)");
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

export const generateRandomPassword = () => {
  const length = 12;
  const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const lowercase = "abcdefghijklmnopqrstuvwxyz";
  const numbers = "0123456789";
  const special = "!@#$%^&*";
  const allChars = uppercase + lowercase + numbers + special;

  let password = "";
  // Ensure at least one of each required type
  password += uppercase.charAt(Math.floor(Math.random() * uppercase.length));
  password += lowercase.charAt(Math.floor(Math.random() * lowercase.length));
  password += numbers.charAt(Math.floor(Math.random() * numbers.length));
  password += special.charAt(Math.floor(Math.random() * special.length));
  
  for (let i = 4; i < length; ++i) {
    password += allChars.charAt(Math.floor(Math.random() * allChars.length));
  }
  
  // Shuffle the password
  return password.split('').sort(() => 0.5 - Math.random()).join('');
};