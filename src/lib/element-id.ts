/**
 * Ids and names that have to be unique among the copies of one component on a
 * page. A component's frontmatter runs once per render and keeps nothing
 * between them, so a counter that survives has to live in a module beside it.
 *
 * The numbers keep climbing across the pages of a build, which is more than
 * uniqueness needs — a name only has to be unlike the others in its own
 * document. What that buys is a build that emits the same markup twice, which
 * a random suffix would not.
 */
let count = 0;

export function uniqueName(prefix: string): string {
  count += 1;
  return `${prefix}-${count}`;
}
