// Found via the Phase 10 QA pass + a live production investigation
// (2026-09-12): every property image uploaded through FtpPropertyImageStorage
// (and the analogous FtpStorageService for documents) 550'd with "No such
// file or directory" against the real Hostinger FTP account. Root cause:
// basic-ftp's `ensureDir(dir)` has the side effect of navigating the FTP
// session's working directory INTO `dir` (confirmed against the real
// account — PWD after ensureDir('uploads/properties/x/images') is that full
// path, not the login root). The old code then called
// `uploadFrom(stream, path.posix.join(remoteDir, filename))` — joining the
// already-current directory onto itself a second time, so it always looked
// for a nonexistent doubled-up path. The fix uploads by `filename` alone,
// relative to the now-current directory ensureDir already navigated into.
//
// This mocks basic-ftp's Client (no real network access) to lock in the
// call sequence rather than exercising the real Hostinger account in CI.

jest.mock('basic-ftp', () => {
  const access = jest.fn().mockResolvedValue(undefined);
  const ensureDir = jest.fn().mockResolvedValue(undefined);
  const uploadFrom = jest.fn().mockResolvedValue(undefined);
  const close = jest.fn();
  return {
    Client: jest.fn().mockImplementation(() => ({
      ftp: { verbose: false },
      access,
      ensureDir,
      uploadFrom,
      close,
    })),
    __mocks: { access, ensureDir, uploadFrom, close },
  };
});

jest.mock('ssh2-sftp-client', () => jest.fn().mockImplementation(() => ({})));

import sharp from 'sharp';
import { FtpPropertyImageStorage } from '../../apps/api/src/services/storage.service';

describe('FtpPropertyImageStorage.upload — the ensureDir CWD-navigation bug', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = {
      ...originalEnv,
      FTP_HOST: 'ftp.example.com',
      FTP_USERNAME: 'user',
      FTP_PASSWORD: 'pass',
      FTP_PORT: '21',
      FTP_REMOTE_BASE_PATH: 'uploads',
      FTP_PUBLIC_BASE_URL: 'https://cdn.example.com/uploads',
    };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('uploads by filename alone (not the full remoteDir+filename path) after ensureDir', async () => {
    const { __mocks } = jest.requireMock('basic-ftp') as any;
    const storage = new FtpPropertyImageStorage();

    // processImageBuffer runs the buffer through sharp before upload, so it
    // must be a real, decodable image, not arbitrary bytes.
    const fakeImage = await sharp({
      create: { width: 4, height: 4, channels: 3, background: { r: 200, g: 0, b: 0 } },
    })
      .png()
      .toBuffer();

    const url = await storage.upload(fakeImage, 42);

    expect(__mocks.ensureDir).toHaveBeenCalledWith('uploads/properties/42/images');

    // The exact bug: uploadFrom must NOT receive the remoteDir joined onto
    // itself again — only the bare filename, since ensureDir already
    // navigated the session into that directory.
    const uploadedPath = __mocks.uploadFrom.mock.calls[0][1];
    expect(uploadedPath).not.toContain('/');
    expect(uploadedPath).toMatch(/^[a-f0-9-]+\.webp$/);

    expect(url).toBe(`https://cdn.example.com/uploads/properties/42/images/${uploadedPath}`);
    expect(__mocks.close).toHaveBeenCalled();
  });
});
