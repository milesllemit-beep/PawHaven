import { validateImageFiles } from './media';

function fakeFile(name: string, type: string, size: number): File {
  return { name, type, size } as unknown as File;
}

describe('validateImageFiles', () => {
  it('accepts an empty selection', () => {
    expect(validateImageFiles([], 10)).toBeNull();
  });

  it('accepts supported jpeg, png and webp files', () => {
    const files = [
      fakeFile('a.jpg', 'image/jpeg', 1024),
      fakeFile('b.png', 'image/png', 2048),
      fakeFile('c.webp', 'image/webp', 4096),
    ];
    expect(validateImageFiles(files, 10)).toBeNull();
  });

  it('rejects an unsupported file type', () => {
    const result = validateImageFiles([fakeFile('a.gif', 'image/gif', 1024)], 10);
    expect(result).toContain('a.gif');
  });

  it('rejects a file larger than 5 MB', () => {
    const result = validateImageFiles(
      [fakeFile('big.jpg', 'image/jpeg', 5 * 1024 * 1024 + 1)],
      10,
    );
    expect(result).toContain('big.jpg');
  });

  it('rejects too many files', () => {
    const files = Array.from({ length: 11 }, (_, i) => fakeFile(`${i}.jpg`, 'image/jpeg', 1024));
    expect(validateImageFiles(files, 10)).toContain('at most 10');
  });
});
