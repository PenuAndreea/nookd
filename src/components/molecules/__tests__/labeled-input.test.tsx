import { fireEvent, render, screen } from '@testing-library/react-native';

import { LabeledInput } from '@/components/molecules/labeled-input';

describe('LabeledInput', () => {
    it('renders its label and placeholder', async () => {
        await render(<LabeledInput label="Room name" placeholder="e.g. Sunday deep work" value="" onChangeText={jest.fn()} />);

        expect(screen.getByText('Room name')).toBeVisible();
        expect(screen.getByPlaceholderText('e.g. Sunday deep work')).toBeVisible();
    });

    it('reports typed text', async () => {
        const onChangeText = jest.fn();
        await render(
            <LabeledInput label="Room name" placeholder="e.g. Sunday deep work" value="" onChangeText={onChangeText} />
        );

        await fireEvent.changeText(screen.getByPlaceholderText('e.g. Sunday deep work'), 'Sunday deep work');

        expect(onChangeText).toHaveBeenCalledWith('Sunday deep work');
    });

    it('shows an error message when given one', async () => {
        await render(<LabeledInput label="Email" value="" onChangeText={jest.fn()} error="Required" />);

        expect(screen.getByText('Required')).toBeVisible();
    });

    it('renders no error message by default', async () => {
        await render(<LabeledInput label="Email" value="" onChangeText={jest.fn()} />);

        expect(screen.queryByText('Required')).toBeNull();
    });
});
