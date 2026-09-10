import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Button } from './button';

// 이 파일은 기능 검증보다 "검증 파이프라인이 실제로 도는지"를 확인하는 역할이 크다.
// 컴포넌트가 늘어나면 각자의 테스트로 옮기고 여기는 최소만 남긴다.
describe('Button', () => {
  it('children을 렌더한다', () => {
    render(<Button>루틴 추천받기</Button>);
    expect(screen.getByRole('button', { name: '루틴 추천받기' })).toBeInTheDocument();
  });

  it('disabled면 비활성 상태로 렌더된다', () => {
    render(<Button disabled>저장</Button>);
    expect(screen.getByRole('button', { name: '저장' })).toBeDisabled();
  });

  it('variant에 따라 클래스가 달라진다', () => {
    const { rerender } = render(<Button>기본</Button>);
    const defaultClass = screen.getByRole('button').className;

    rerender(<Button variant="outline">아웃라인</Button>);
    expect(screen.getByRole('button').className).not.toBe(defaultClass);
  });
});
