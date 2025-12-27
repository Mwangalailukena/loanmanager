
// TODO: Make the country code configurable
export const generateWhatsAppLink = (phone, message) => {
  const encodedMessage = encodeURIComponent(message);
  let formattedPhone;

  if (phone.startsWith('+')) {
    formattedPhone = phone;
  } else if (phone.startsWith('0')) {
    formattedPhone = `+260${phone.substring(1)}`;
  } else {
    formattedPhone = `+260${phone}`;
  }

  return `https://wa.me/${formattedPhone}?text=${encodedMessage}`;
};
