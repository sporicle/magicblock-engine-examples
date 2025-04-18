use anchor_lang::prelude::*;
use ephemeral_rollups_sdk::anchor::{commit, delegate, ephemeral};
use ephemeral_rollups_sdk::cpi::DelegateConfig;
use ephemeral_rollups_sdk::ephem::{commit_accounts, commit_and_undelegate_accounts};

declare_id!("EB9qNdGitcvC6XPagSJaCxWbDsbGpzP7qKKArbK8iax5");

pub const PAINTING_PDA_SEED: &[u8] = b"painting-canvas";
pub const BOARD_SIZE: usize = 20;
pub const NUM_COLORS: usize = 8;

#[ephemeral]
#[program]
pub mod anchor_counter {
    use super::*;

    /// Initialize the painting board.
    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        let painting = &mut ctx.accounts.painting;
        // Initialize all pixels to color 0 (which will be white/empty)
        painting.pixels = [[0; BOARD_SIZE]; BOARD_SIZE];
        Ok(())
    }

    /// Paint a pixel on the board with the selected color.
    pub fn paint_pixel(ctx: Context<PaintPixel>, x: u8, y: u8, color_index: u8) -> Result<()> {
        if x as usize >= BOARD_SIZE || y as usize >= BOARD_SIZE {
            return Err(error!(ErrorCode::InvalidCoordinates));
        }
        
        if color_index as usize >= NUM_COLORS {
            return Err(error!(ErrorCode::InvalidColor));
        }
        
        let painting = &mut ctx.accounts.painting;
        painting.pixels[y as usize][x as usize] = color_index;
        Ok(())
    }

    /// Delegate the account to the delegation program
    pub fn delegate(ctx: Context<DelegateInput>) -> Result<()> {
        ctx.accounts.delegate_pda(
            &ctx.accounts.payer,
            &[PAINTING_PDA_SEED],
            DelegateConfig::default(),
        )?;

        Ok(())
    }

    /// Undelegate the account from the delegation program
    pub fn undelegate(ctx: Context<PaintAndCommit>) -> Result<()> {
        commit_and_undelegate_accounts(
            &ctx.accounts.payer,
            vec![&ctx.accounts.painting.to_account_info()],
            &ctx.accounts.magic_context,
            &ctx.accounts.magic_program,
        )?;
        Ok(())
    }

    /// Paint a pixel and commit the account in the ER.
    pub fn paint_and_commit(ctx: Context<PaintAndCommit>, x: u8, y: u8, color_index: u8) -> Result<()> {
        if x as usize >= BOARD_SIZE || y as usize >= BOARD_SIZE {
            return Err(error!(ErrorCode::InvalidCoordinates));
        }
        
        if color_index as usize >= NUM_COLORS {
            return Err(error!(ErrorCode::InvalidColor));
        }
        
        let painting = &mut ctx.accounts.painting;
        painting.pixels[y as usize][x as usize] = color_index;
        
        commit_accounts(
            &ctx.accounts.payer,
            vec![&ctx.accounts.painting.to_account_info()],
            &ctx.accounts.magic_context,
            &ctx.accounts.magic_program,
        )?;
        Ok(())
    }

    /// Paint a pixel and undelegate the account from the ER.
    pub fn paint_and_undelegate(ctx: Context<PaintAndCommit>, x: u8, y: u8, color_index: u8) -> Result<()> {
        if x as usize >= BOARD_SIZE || y as usize >= BOARD_SIZE {
            return Err(error!(ErrorCode::InvalidCoordinates));
        }
        
        if color_index as usize >= NUM_COLORS {
            return Err(error!(ErrorCode::InvalidColor));
        }
        
        let painting = &mut ctx.accounts.painting;
        painting.pixels[y as usize][x as usize] = color_index;
        
        // Serialize the painting account, commit and undelegate
        painting.exit(&crate::ID)?;
        commit_and_undelegate_accounts(
            &ctx.accounts.payer,
            vec![&ctx.accounts.painting.to_account_info()],
            &ctx.accounts.magic_context,
            &ctx.accounts.magic_program,
        )?;
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(init, payer = user, space = 8 + (BOARD_SIZE * BOARD_SIZE), seeds = [PAINTING_PDA_SEED], bump)]
    pub painting: Account<'info, Painting>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[delegate]
#[derive(Accounts)]
pub struct DelegateInput<'info> {
    pub payer: Signer<'info>,
    /// CHECK The pda to delegate
    #[account(mut, del)]
    pub pda: AccountInfo<'info>,
}

/// Account for the paint pixel instruction.
#[derive(Accounts)]
pub struct PaintPixel<'info> {
    #[account(mut, seeds = [PAINTING_PDA_SEED], bump)]
    pub painting: Account<'info, Painting>,
    pub user: Signer<'info>,
}

/// Account for painting + manual commit.
#[commit]
#[derive(Accounts)]
pub struct PaintAndCommit<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(mut, seeds = [PAINTING_PDA_SEED], bump)]
    pub painting: Account<'info, Painting>,
}

#[account]
pub struct Painting {
    pub pixels: [[u8; BOARD_SIZE]; BOARD_SIZE]
}

#[error_code]
pub enum ErrorCode {
    #[msg("Invalid coordinates")]
    InvalidCoordinates,
    #[msg("Invalid color index")]
    InvalidColor,
}
