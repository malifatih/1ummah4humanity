import { MAX_POST_LENGTH, MAX_COMMENT_LENGTH, MAX_USERNAME_LENGTH, MAX_BIO_LENGTH } from '../constants/index';

const USERNAME_REGEX = /^[a-zA-Z0-9_]+$/;
const HASHTAG_REGEX = /#[\w]+/g;
const MENTION_REGEX = /@[\w]+/g;

export function isValidUsername(username: string): boolean {
  return (
    username.length >= 3 &&
    username.length <= MAX_USERNAME_LENGTH &&
    USERNAME_REGEX.test(username)
  );
}

export function isValidPostContent(content: string): boolean {
  return content.length > 0 && content.length <= MAX_POST_LENGTH;
}

export function isValidCommentContent(content: string): boolean {
  return content.length > 0 && content.length <= MAX_COMMENT_LENGTH;
}

export function isValidBio(bio: string): boolean {
  return bio.length <= MAX_BIO_LENGTH;
}

export function extractHashtags(text: string): string[] {
  const matches = text.match(HASHTAG_REGEX);
  if (!matches) return [];
  return [...new Set(matches.map((tag) => tag.slice(1).toLowerCase()))];
}

export function extractMentions(text: string): string[] {
  const matches = text.match(MENTION_REGEX);
  if (!matches) return [];
  return [...new Set(matches.map((mention) => mention.slice(1).toLowerCase()))];
}

export function isValidEthAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}
