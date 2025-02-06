import { ParseTextBotCommandOutput, Group } from './interfaces';

/**
 * Parses a command in the form of:
 *   txt <group name> <message>
 *
 * The group name matching is case-insensitive and ignores any spaces.
 * The message is returned with its leading and trailing spaces removed.
 *
 * If the command does not match or a group cannot be identified, returns null.
 *
 * @param rawInput The raw input command string.
 * @param groups The list of available groups.
 * @returns The parsed command output or null.
 */
export const parseTextBotCommand = (
  rawInput: string,
  groups: Group[]
): ParseTextBotCommandOutput | null => {
  // Trim the input and ensure it starts with "txt" (ignoring case).
  const trimmedInput = rawInput.trim();
  if (!trimmedInput.toLowerCase().startsWith('txt')) {
    return null;
  }

  // Remove the "txt" command and any extra spaces.
  let remainder = trimmedInput.substring(3).trimStart();
  if (remainder.length === 0) {
    // Nothing follows "txt"
    return null;
  }

  // Sort groups by descending normalized name length to prioritize longer matches.
  const sortedGroups = groups.slice().sort((a, b) => {
    const firstNormLength = a.name.replace(/\s+/g, '').length;
    const secondNormLength = b.name.replace(/\s+/g, '').length;
    return secondNormLength - firstNormLength;
  });

  // Try to match each group's name from the start of the remainder.
  for (const group of sortedGroups) {
    const matchIndex = matchGroupName(remainder, group.name);
    if (matchIndex !== null) {
      // The rest of the input (after the group name) is the message.
      const message = remainder.substring(matchIndex).trim();
      return {
        groupId: group.id,
        messageToSend: message,
      };
    }
  }

  // No group was matched.
  return null;
};

/**
 * Attempts to match the group name at the start of the input string.
 *
 * The matching ignores any spaces in the group name and the input,
 * and it is case-insensitive. It also ensures that the matched portion
 * ends at a word boundary (i.e. end-of-string or a space).
 *
 * @param input The string to match against (should start with the group name).
 * @param groupName The group name to match.
 * @returns The index in input immediately after the matched group name,
 *          or null if no match is found.
 */
const matchGroupName = (input: string, groupName: string): number | null => {
  // Normalize the group name by removing all spaces and converting to lowercase.
  const normalizedGroup = groupName.replace(/\s+/g, '').toLowerCase();
  let i = 0; // pointer in the input string
  let j = 0; // pointer in the normalized group string

  while (i < input.length && j < normalizedGroup.length) {
    if (input[i] === ' ') {
      // Skip any spaces in the input.
      i++;
      continue;
    }
    if (input[i].toLowerCase() === normalizedGroup[j]) {
      i++;
      j++;
    } else {
      // Mismatch found.
      return null;
    }
  }

  // Ensure that the entire normalized group name was matched.
  if (j !== normalizedGroup.length) {
    return null;
  }

  // To avoid partial matches (e.g., "hotline" vs. "hotlines"),
  // ensure that the matched portion is delimited by a space or ends at the input.
  if (i < input.length && input[i] !== ' ') {
    return null;
  }

  return i;
};